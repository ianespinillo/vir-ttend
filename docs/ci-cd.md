# CI/CD Pipeline

The repo ships a two-stage pipeline: **CI** (`.github/workflows/ci.yaml`) validates every pull request and non-main branch push; **CD** (`.github/workflows/cd.yaml`) builds Docker images for the API and client, pushes them to GHCR, and deploys them to the production VM on every push to `main`.

```
push to main
   │
   ▼
CI (on PRs / other branches)          CD (on main)
lint, typecheck, tests, build          build + push api/client images to GHCR
                                       │
                                       ▼
                                  SSH to VM (/home/ubuntu/vir-ttend)
                                  git pull --ff-only
                                  docker login ghcr.io (PAT)
                                  docker compose ... pull            <- new images by tag
                                  docker compose ... up -d --wait postgres redis
                                  mikro-orm migration:up            <- explicit, before apps
                                  docker compose ... up -d --wait    <- api, client, caddy
                                  health probe + compose ps
```

Key facts:

| Topic | Decision |
|-------|----------|
| Images | `ghcr.io/ianespinillo/vir-ttend/api` and `.../client`, tagged `sha-<full git sha>` + `latest` |
| Image selection on VM | `compose.ci.yml` override maps `api`/`client` to the GHCR images via `IMAGE_TAG`; no local builds |
| Migrations | Run explicitly via `docker compose run --rm --no-deps api ... migration:up` **before** `up -d` |
| Secrets | `.env` lives only on the VM and in GitHub Secrets; nothing sensitive is committed |
| External images | `postgres`, `redis`, `caddy` are pulled from Docker Hub as before |

## Required GitHub Secrets

Create these in the repo settings (Settings → Secrets and variables → Actions). `gh` CLI is not required; the secrets must exist before the first CD run, otherwise the deploy job fails.

| Secret | Purpose |
|--------|---------|
| `SSH_HOST` | Public IP/hostname of the VM (e.g. the `aws-virttend` instance) |
| `SSH_USER` | SSH user on the VM (e.g. `ubuntu`) |
| `SSH_PRIVATE_KEY` | Private key for the SSH user (the VM-side public key must be in the user's `authorized_keys`) |
| `SSH_PORT` | Optional; omit when the VM uses the default SSH port 22 (if set, also add the `port:` input to the `appleboy/ssh-action` step) |
| `GHCR_USERNAME` | GitHub username used to log in to GHCR **on the VM** |
| `GHCR_TOKEN` | GitHub **PAT** with `read:packages` scope. The workflow pushes with the automatic `GITHUB_TOKEN` (no secret needed for the push side), but the VM cannot use a repo-scoped token, so it needs its own credential to pull the images |
| `NEXT_PUBLIC_API_URL` | Public HTTPS URL of the API. Passed as a build argument to the client image (Next.js bakes it in at build time); must match the `NEXT_PUBLIC_API_URL` the VM `.env` uses |

Notes:

- The GHCR packages are private by default. Either keep them private (VM login with `GHCR_TOKEN` handles it) or set them public; private is the default and is what the pipeline assumes.
- `GITHUB_TOKEN` (automatic) is used inside the CD workflow only: `permissions: packages: write` allows pushing to GHCR without any secret.
- The VM's `/home/ubuntu/vir-ttend/.env` file stays untouched by the pipeline; `compose.prod.yml` reads it as before.

## Migration step (T3) — how and why

**Problem.** The API runner image previously copied only `apps/api/dist`. The MikroORM CLI config (`apps/api/package.json` → `mikro-orm.configPaths`) and the migrations themselves are TypeScript sources under `apps/api/src/modules/shared/database/`. Any migration step that runs inside the image therefore could not find them.

**Solution chosen (option a).** The runner stage of `apps/api/dockerfile` now also copies:

- `apps/api/src` (migration files, CLI config, and everything the config imports),
- `apps/api/tsconfig.json` (required by `ts-node`, which the MikroORM CLI auto-registers to load the `.ts` config and `.ts` migrations).

`ts-node`, the `@mikro-orm/cli`, and the rest of the dev toolchain are already present in the runner because it copies the `node_modules` trees from the builder (which installs dev dependencies).

The CD deploy script then runs migrations as an explicit step between infrastructure startup and app startup:

```bash
docker compose -f compose.prod.yml -f compose.ci.yml run --rm --no-deps \
  api sh -c "cd apps/api && node node_modules/@mikro-orm/cli/cli.js migration:up"
```

**Why this over the alternatives.**

- *Why not a `migrate` service or migrations-on-boot?* Running migrations automatically when the API starts makes rollback and boot ordering implicit and can race multiple replicas. Keeping the step explicit in CD puts it in one visible place, before `up -d`, and fails the deploy loudly.
- *Why option (a) over a CD-only volume mount?* The mounted-source approach (`docker compose run -v ...`) depends on the VM checkout layout and bypasses the image contract; shipping sources inside the image keeps the image self-contained and makes the same command reproducible anywhere (CI, local, VM).
- *Why `cd apps/api`?* The CLI resolves `mikro-orm.configPaths` and the relative `paths` (`./src/...`, `dist/**`) against the working directory of the `api` package.

Validated end-to-end locally (see Verification below): the command applied all 7 migrations against a real Postgres from inside the built image.

## How image tags reach the VM

`compose.ci.yml` (repo root) is a committed Compose override:

```yaml
services:
  api:
    image: ghcr.io/ianespinillo/vir-ttend/api:${IMAGE_TAG:-latest}
  client:
    image: ghcr.io/ianespinillo/vir-ttend/client:${IMAGE_TAG:-latest}
```

The deploy job exports `IMAGE_TAG=sha-<git sha>` (workflow env, derived from `github.sha`, matching the `type=sha,format=long` tag metadata-action generates). Every compose call on the VM uses `-f compose.prod.yml -f compose.ci.yml`, so `api`/`client` resolve to the freshly pushed images and nothing is rebuilt on the VM. Compose uses the `image:` when the tag exists locally (verified behavior), so `up -d` starts exactly what CI pushed.

## Action versions pinned

| Action | Version | Notes |
|--------|---------|-------|
| `actions/checkout` | `v3` | Matches the existing `ci.yaml` style |
| `docker/setup-buildx-action` | `v4` | |
| `docker/login-action` | `v4` | |
| `docker/metadata-action` | `v6` | `type=sha,format=long` + `type=raw,value=latest` |
| `docker/build-push-action` | `v7` | |
| `appleboy/ssh-action` | `v1` | Handles SSH + passes `IMAGE_TAG`/`GHCR_USERNAME`/`GHCR_TOKEN` to the remote session |

## Manual deploy (fallback)

If the CD workflow is broken or you need a manual deploy, run these on the VM:

```bash
ssh aws-virttend
cd /home/ubuntu/vir-ttend

git pull --ff-only

# use the tag you want to deploy, e.g. sha-<git sha> or latest
export IMAGE_TAG=latest

echo "<GHCR_TOKEN>" | docker login ghcr.io -u "<GHCR_USERNAME>" --password-stdin
docker compose -f compose.prod.yml -f compose.ci.yml pull postgres redis caddy api client
docker compose -f compose.prod.yml -f compose.ci.yml up -d --wait postgres redis

docker compose -f compose.prod.yml -f compose.ci.yml run --rm --no-deps \
  api sh -c "cd apps/api && node node_modules/@mikro-orm/cli/cli.js migration:up"

docker compose -f compose.prod.yml -f compose.ci.yml up -d --wait
docker compose -f compose.prod.yml -f compose.ci.yml ps
```

Rollback: point `IMAGE_TAG` back at the previous `sha-<git sha>` tag and repeat the pull + `up -d --wait` steps.

## Setup checklist (first CD run)

- [ ] `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `GHCR_USERNAME`, `GHCR_TOKEN`, `NEXT_PUBLIC_API_URL` added as GitHub Secrets
- [ ] VM can be reached from GitHub Actions (public IP / security group allows SSH from the runner; agent-based hopping is not supported by the current pipeline)
- [ ] VM has the repo checked out at `/home/ubuntu/vir-ttend` on `main` and `compose.ci.yml` present after `git pull`
- [ ] First deploy: `docker compose -f compose.prod.yml -f compose.ci.yml ps` shows `api`/`client` healthy and Caddy serving HTTPS