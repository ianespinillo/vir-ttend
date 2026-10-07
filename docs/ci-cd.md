# CI/CD Pipeline

The repo ships a two-stage pipeline: **CI** (`.github/workflows/ci.yaml`) validates every pull request and non-main branch push; **CD** (`.github/workflows/cd.yaml`) builds Docker images for the API and client, pushes them to GHCR, and on every push to `main` deploys them to EVERY environment in its fan-out list (in parallel), while `workflow_dispatch` deploys a single chosen environment.

```
push to main
   │
   ▼
CI (on PRs / other branches)          CD (on main / dispatch)
lint, typecheck, tests, build          build + push api/client images to GHCR
                                       │
                                       ▼
                                  SSH to VM (/home/ubuntu/vir-ttend)
                                  git fetch --prune + checkout $DEPLOY_SHA
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

## Required GitHub Secrets (por GitHub Environment)

Crea un Environment de GitHub (Settings → Environments → New environment) y agrega estos secretos como **secretos del ambiente**. El workflow de CD resuelve el environment del job `deploy` por leg de la matriz (`matrix.environment`): en un push a `main` es cada nombre de la lista fan-out de `jobs.targets`; en un `workflow_dispatch` es el input `target`. Cada despliegue resuelve así sus credenciales desde el ambiente destino; agregar más environments agrega más targets (ver "Agregar o quitar un entorno"). No se requiere `gh` CLI (usar la web UI).

| Secret | Purpose |
|--------|---------|
| `SSH_HOST` | Public IP/hostname de la VM de este ambiente (p. ej. la instancia `aws-virttend`) |
| `SSH_USER` | Usuario SSH en la VM (p. ej. `ubuntu`) |
| `SSH_PRIVATE_KEY` | Clave privada del usuario SSH (la clave pública del lado VM debe estar en su `authorized_keys`) |
| `GHCR_USERNAME` | Usuario de GitHub para el login a GHCR **en la VM** |
| `GHCR_TOKEN` | **PAT** de GitHub con scope `read:packages`. El workflow pushea con el `GITHUB_TOKEN` automático (no hace falta secreto del lado push), pero la VM no puede usar un token con scope de repo, así que necesita su propio credencial para pull de imágenes |

Notas:

- `SSH_PORT`: opcional; omitir si la VM usa el puerto 22 por defecto (si se define, agregar también el input `port:` al paso `appleboy/ssh-action`).
- `NEXT_PUBLIC_API_URL` ya NO es secreto: el workflow compila el client con el build-arg fijo `/api` (same-origin, ver spec); cada instancia lo define en su `.env` runtime.
- Los GHCR packages son privados por defecto. Mantenerlos privados es lo que el pipeline asume (el login de la VM con `GHCR_TOKEN` lo resuelve).
- `GITHUB_TOKEN` (automático) se usa dentro del workflow: `permissions: packages: write` permite pushear a GHCR sin ningún secreto.
- El `.env` de la VM (`/home/ubuntu/vir-ttend/.env`) NO lo modifica el pipeline (solo lectura): `compose.prod.yml` lo lee igual que antes.

## Despliegue parametrizado (workflow_dispatch)

| Disparador | `target` | `sha` | Comportamiento |
|---|---|---|---|
| Push a `main` | ignorado (push usa la lista fan-out de `jobs.targets`) | vacío → el commit del push | build + deploy del HEAD de main a TODOS los environments de la lista, en paralelo (`fail-fast: false`) |
| `workflow_dispatch` | Environment a desplegar (default `eest3`) | vacío | build + deploy del HEAD actual de main |
| `workflow_dispatch` | Environment a desplegar | commit sha completo | build saltado; `verify-images` confirma que `sha-<sha>` existe en GHCR; deploy de ese commit |

- Cada environment resuelve sus propios secretos `SSH_*` y `GHCR_*`.
- **Rollback:** Actions → `cd` → Run workflow → `target` = ambiente, `sha` = último commit bueno. El deploy hace `git fetch` + `git checkout --detach` de ese sha y levanta exactamente sus imágenes (`sha-<sha>`).

## Agregar o quitar un entorno

Cada merge a `main` despliega en paralelo **todos** los environments de la lista fan-out de `jobs.targets` en `.github/workflows/cd.yaml` (hoy: `eest3`); un `workflow_dispatch` despliega solo el `target` elegido.

| Paso | Acción |
|------|--------|
| 1. Crear el environment | Settings → Environments → New environment `<nombre>` → agregar los 5 Environment secrets (`SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `GHCR_USERNAME`, `GHCR_TOKEN`). Detalle y generación de la clave: [`./vm-bootstrap.md#8-environment-prod-en-github`](./vm-bootstrap.md#8-environment-prod-en-github) |
| 2. Agregarlo al fan-out | Editar `jobs.targets` en `.github/workflows/cd.yaml` y sumar el nombre a la lista JSON del paso `push` (p. ej. `["eest3","staging"]`). Esa lista es lo que decide qué entornos se despliegan en **cada merge a main** |
| 3. Dispatch manual | Run workflow con `target=<nombre>` despliega UN solo entorno sin esperar merge (el default del input es `eest3`; cambiarlo en `cd.yaml` si el entorno principal cambia) |
| 4. Probar antes del merge | Disparar `Run workflow` con `target=<nombre>` y verificar el job `deploy` con ese environment |
| 5. Quitar del fan-out | Borrar su nombre de la lista en `jobs.targets`; el environment en GitHub puede permanecer (solo deja de auto-desplegarse) |

## Alta de nueva instancia (checklist)

> Guía completa paso a paso (de cero a VM operativa): [`docs/vm-bootstrap.md`](../vm-bootstrap.md).

1. VM nueva Ubuntu con Docker + Docker Compose v2 y puertos 80/443 abiertos.
2. Clonar el repo en la ruta esperada: `git clone <repo-url> /home/ubuntu/vir-ttend`.
3. Crear `/home/ubuntu/vir-ttend/.env` con la configuración de la instancia:
   - `POSTGRES_USER`, `POSTGRES_DB`, `POSTGRES_PASSWORD` (crudo, para el contenedor) y `POSTGRES_PASSWORD_URL` (URL-encoded, solo para `DATABASE_URL`)
   - `REDIS_PASSWORD` (crudo) y `REDIS_PASSWORD_URL` (URL-encoded, solo para `REDIS_URL`)
   - `NEXT_PUBLIC_API_URL=/api`
   - `VIR_DOMAIN=<dominio-de-la-instancia>`
   - `CORS_ORIGINS=https://<dominio-de-la-instancia>`
   - `JWT_SECRET`, `JWT_REFRESH_SECRET`
   - `TENANT_ID`, `TENANT_SLUG`, `TENANT_NAME`, `SCHOOL_NAME`, `BOOTSTRAP_ADMIN_*`, `ALLOW_SUPERADMIN` (tenancy de la instancia; `TENANCY_MODE=single` va fijo en `compose.prod.yml`)
4. GitHub: Settings → Environments → crear el ambiente (p. ej. `eest3`) con los 5 secretos: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `GHCR_USERNAME`, `GHCR_TOKEN` (PAT `read:packages`).
5. Primer despliegue: Actions → `cd` → Run workflow (`target` = ese ambiente, `sha` vacío) y verificar health + `docker compose ps`.

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

The deploy job exports `IMAGE_TAG=sha-<git sha>` (workflow env, derived from `inputs.sha || github.sha`, matching the `type=sha,format=long` tag metadata-action generates). Every compose call on the VM uses `-f compose.prod.yml -f compose.ci.yml`, so `api`/`client` resolve to the freshly pushed images and nothing is rebuilt on the VM. Compose uses the `image:` when the tag exists locally (verified behavior), so `up -d` starts exactly what CI pushed.

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

git fetch --prune origin
git -c advice.detachedHead=false checkout --quiet --detach <sha-deseado>

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

Rollback preferido: disparar `cd` por `workflow_dispatch` con el `sha` del último commit bueno (ver "Despliegue parametrizado"). Fallback manual: exportar `IMAGE_TAG=sha-<sha>` y repetir los pasos de pull + `up -d --wait`.

## Setup checklist (first CD run)

- [ ] GitHub Environment `eest3` creado con `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `GHCR_USERNAME`, `GHCR_TOKEN` como secretos del ambiente
- [ ] VM can be reached from GitHub Actions (public IP / security group allows SSH from the runner; agent-based hopping is not supported by the current pipeline)
- [ ] VM has the repo checked out at `/home/ubuntu/vir-ttend` on `main` (el pipeline hace `checkout --detach` del sha a desplegar) and `compose.ci.yml` present
- [ ] First deploy: `docker compose -f compose.prod.yml -f compose.ci.yml ps` shows `api`/`client` healthy and Caddy serving HTTPS