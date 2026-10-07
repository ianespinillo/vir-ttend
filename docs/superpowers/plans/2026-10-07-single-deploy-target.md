# Single Deploy Target (deploy canónico parametrizado) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unificar el modelo de despliegue en UNA definición canónica (compose + Caddy + pipeline CD) parametrizada por GitHub Environments, para que cada instancia sea un target barato con el mismo par de imágenes por commit.

**Architecture:** `compose.prod.yml` es el único compose de producción (se elimina `compose.single-tenant.yml`); Caddy sirve client y API bajo un solo origen (`handle_path /api/*` parametrizado con `{$VIR_DOMAIN}`); `cd.yaml` construye un par de imágenes por commit en GHCR (`sha-<full>` + `latest`) y despliega por ambiente (`target`) y revisión (`sha`), con checkout exacto del sha en la VM en lugar de `git pull`.

**Tech Stack:** Docker Compose v2, Caddy 2, GitHub Actions (`docker/build-push-action`, `appleboy/ssh-action@v1`, GHCR), MikroORM (migraciones vía CLI), Next.js (`NEXT_PUBLIC_API_URL` horneado en build), PowerShell 7 (comandos locales), Bash (runbook SSH).

**Spec:** `docs/superpowers/specs/2026-10-07-single-deploy-target-design.md`

**Branch:** `feat/single-deploy-target` (creada)

## Global Constraints

- Rama `feat/single-deploy-target` (creada); un commit work-unit por tarea; push/PR es decisión del usuario (nunca push sin pedir; `gh` CLI no está instalado).
- Husky falla localmente por CRLF/biome → commitear con `git commit --no-verify` (decisión previa y estable del usuario). NUNCA `git add .` — solo archivos intencionales.
- Conventional commits, asunto ≤72 chars, sin atribución AI ni Co-Authored-By.
- RDD (review-driven) está OFF globalmente → verificación = comandos funcionales reportados + spot-check de diff; sin ciclo de review nativo.
- Artefactos técnicos en español neutro/profesional; comandos/identificadores en su forma natural (English).
- Nunca imprimir secrets ni `.env` en outputs/logs.
- Los comandos de **Verification** son EXACTAMENTE los que ejecuta el executor (PowerShell-compatible salvo donde se indique Bash en la VM); cada tarea lista los suyos.
- Un commit work-unit por tarea (Task 6: n/a — runbook).

---

### Task 1: Portar hotfix `allowGlobalContext` a MikroORM inline

**Files:**
- Modify: `apps/api/src/app.module.ts:26` (dentro de `MikroOrmModule.forRootAsync` → `useFactory`)

**Contexto:** La VM corre este flag como hotfix local (spec F3). Sin portarlo, el primer deploy del pipeline revierte el hotfix de producción. El flag ya se usa en `mikro-orm.config.ts:25` y `scripts/seed.ts:641`; `app.module.ts` es el único punto que inicializa MikroORM inline.

- [ ] **Step 1:** Editar `apps/api/src/app.module.ts`: insertar `allowGlobalContext: true,` INMEDIATAMENTE después de `autoLoadEntities: true,` (línea 26), dentro del objeto de `useFactory`. El bloque debe quedar así (indentación con TABS, como el resto del archivo — Biome usa tabs):

```ts
		MikroOrmModule.forRootAsync({
			useFactory: (configService: ConfigService) => ({
				driver: PostgreSqlDriver,
				clientUrl: configService.get<string>('DATABASE_URL'),
				autoLoadEntities: true,
				allowGlobalContext: true,
				debug: true,
				migrations: {
					path: './src/shared/database/migrations',
				},
			}),
			inject: [ConfigService],
		}),
```

- [ ] **Step 2:** Typecheck: `pnpm run ts:check` (turbo `ts:check` en la raíz) → exit code 0.

**Verification:**

```powershell
pnpm run ts:check
```

Esperado: sale 0, sin errores de tipo.

**Commit:**

```powershell
git add apps/api/src/app.module.ts
git commit --no-verify -m "fix(api): enable mikro-orm global context to match production hotfix"
```

---

### Task 2: Compose canónico (`compose.prod.yml`, `.env.production.example`, retiro del single-tenant)

**Files:**
- Modify: `compose.prod.yml:42-43` (connection strings), `:76-78` (build-arg del client), `:84` (env del client), `:89-102` (servicio `caddy`)
- Modify: `.env.production.example:52` + append al final del archivo
- Delete: `compose.single-tenant.yml`
- Modify: `README.md:77`
- Modify: `doc/deployment-configuration.md:187-198` (§Paso 4)

**Contexto:** `compose.prod.yml` es el único compose canónico (spec D3). La VM ya usa las variantes `_URL` de los passwords (spec F1); el repo debe igualarlas. `NEXT_PUBLIC_API_URL` pasa a relativo `/api` con default (spec D2). Caddy recibe `VIR_DOMAIN` por environment (spec D7).

- [ ] **Step 1:** En `api.environment` de `compose.prod.yml`, reemplazar (líneas 42-43):

```yaml
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
```

por:

```yaml
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD_URL}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://:${REDIS_PASSWORD_URL}@redis:6379
```

NO tocar los passwords crudos de los servicios `postgres` (líneas 7-9) ni `redis` (líneas 23 y 28): siguen siendo obligatorios; solo las cadenas de conexión migran a las variantes `_URL`.

- [ ] **Step 2:** En `client.build.args` (líneas 76-78), reemplazar:

```yaml
      args:
        # Must be the public HTTPS URL (used at build time by Next.js)
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
```

por:

```yaml
      args:
        # Relative /api, same-origin (standard for all instances)
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-/api}
```

- [ ] **Step 3:** En `client.environment` (línea 84), reemplazar:

```yaml
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
```

por:

```yaml
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-/api}
```

- [ ] **Step 4:** En el servicio `caddy`, insertar un bloque `environment` entre `restart: unless-stopped` y `ports:` (indentación: 4 espacios para `environment:`, 6 para `VIR_DOMAIN:`):

```yaml
    environment:
      VIR_DOMAIN: ${VIR_DOMAIN:-virttend.duckdns.org}
```

- [ ] **Step 5:** `.env.production.example` (el patrón de permisos `*.env.*` puede pedir aprobación al leer/editar el archivo — aceptarla; seguir el estilo `clave=valor` con comentarios `#` del archivo):
  - a) Reemplazar el valor de la línea 52 (hoy un valor absoluto de ejemplo): la línea debe quedar exactamente `NEXT_PUBLIC_API_URL=/api`. Si la línea de comentario contigua menciona una URL absoluta, ajustarla a: `# Relativo y same-origin: el client llama a la API en /api (estándar para todas las instancias)`. NO agregar una segunda clave `NEXT_PUBLIC_API_URL`.
  - b) Append al final del archivo:

```
# Variantes URL-encoded de los passwords: se usan SOLO en DATABASE_URL/REDIS_URL.
# Los valores crudos (POSTGRES_PASSWORD/REDIS_PASSWORD) pueden ser base64 y contener
# '+' '/' '=' que rompen la URL de conexión; estas variantes deben estar URL-encoded
# (p. ej. '+' -> '%2B', '/' -> '%2F', '=' -> '%3D').
POSTGRES_PASSWORD_URL=change_me_strong_password_url_encoded
REDIS_PASSWORD_URL=change_me_redis_password_url_encoded

# Dominio servido por Caddy (la Caddyfile usa {$VIR_DOMAIN}); lo inyecta compose.prod.yml.
VIR_DOMAIN=virttend.duckdns.org
```

- [ ] **Step 6:** Eliminar el compose huérfano: `git rm compose.single-tenant.yml`.

- [ ] **Step 7:** `README.md` línea 77, la fila de la tabla debe quedar:

```markdown
| **Orquestación Docker** | `compose.yml` | `compose.prod.yml` |
```

- [ ] **Step 8:** `doc/deployment-configuration.md` §Paso 4 (líneas 187-198), reemplazar el bloque actual (que enlaza `compose.single-tenant.yml` vía `file:///` y lista contenedores `virttend_colegio-san-martin_*`) por:

````markdown
### Paso 4: Despliegue con Docker Compose

El archivo canónico de producción es [`compose.prod.yml`](../compose.prod.yml): una instancia = una pila por VM, parametrizada por su `.env`.

```bash
docker compose -f compose.prod.yml up -d
```

Este comando levanta:
- Contenedor PostgreSQL (`vir-ttend_postgres`) con volumen persistente propio.
- Contenedor Redis (`vir-ttend_redis`).
- Contenedor API NestJS (`vir-ttend_api`) ejecutando el auto-bootstrap al arrancar.
- Contenedor Next.js (`vir-ttend_client`).
- Contenedor Caddy (`vir-ttend_caddy`) como reverse proxy de un solo origen.
````

El texto nuevo NO debe contener la cadena `compose.single-tenant` (rompe la Verification de esta tarea).

**Verification:**

```powershell
docker compose --env-file .env.production.example -f compose.prod.yml config | Out-Null
if ($LASTEXITCODE -ne 0) { throw "compose config failed" }
docker compose --env-file .env.production.example -f compose.prod.yml config | Select-String -Pattern "POSTGRES_PASSWORD_URL", "VIR_DOMAIN", "NEXT_PUBLIC_API_URL: /api"
rg -n "compose\.single-tenant" . --glob "!docs/superpowers/**"
```

Esperado: el config sale 0; `Select-String` encuentra los 3 patrones (`NEXT_PUBLIC_API_URL: /api` aparece en `build.args` y en `environment`); `rg` no imprime nada (exit 1 = sin coincidencias).

**Commit:**

```powershell
git add compose.prod.yml .env.production.example README.md doc/deployment-configuration.md
git commit --no-verify -m "chore(deploy): canonicalize compose.prod.yml, retire single-tenant"
```

(`git rm` de Step 6 ya dejó la deletión staged.)

---

### Task 3: Caddyfile canónico same-origin

**Files:**
- Modify (reemplazo completo del contenido): `Caddyfile`

**Contexto:** Spec F2/D7. El repo sirve dos dominios y no tiene `handle_path`; la VM ya corre el bloque same-origin. Con `NEXT_PUBLIC_API_URL=/api` (Task 2), el client y la API comparten origen y se elimina el bloque del subdominio `-api`.

- [ ] **Step 1:** Reemplazar TODO el contenido de `Caddyfile` por exactamente este contenido (indentación de 4 espacios, sin cambios):

```caddy
# Caddyfile — Vir-ttend production reverse proxy (canónico)
#
# {$VIR_DOMAIN} se inyecta desde compose.prod.yml (environment VIR_DOMAIN,
# default virttend.duckdns.org). Caddy obtiene y renueva TLS vía Let's Encrypt;
# los puertos 80/443 deben estar abiertos en la VM.
#
# Mismo origen: el client llama a la API en /api (NEXT_PUBLIC_API_URL=/api)
# y handle_path quita el prefijo antes del proxy (fix del 401 SameSite).

{$VIR_DOMAIN} {
    handle_path /api/* {
        reverse_proxy api:3001
    }
    reverse_proxy client:3000
}
```

- [ ] **Step 2:** Validar la sintaxis con Docker Desktop en marcha (PowerShell, desde la raíz del repo):

```powershell
docker run --rm -e VIR_DOMAIN=virttend.duckdns.org -v "${PWD}\Caddyfile:/etc/caddy/Caddyfile:ro" caddy:2 caddy validate
```

Esperado: `Valid configuration`.

- [ ] **Step 3:** Verificar que no quedó referencia de dominio al subdominio `-api`:

```powershell
rg -n "virttend-api" Caddyfile docs README.md --glob "!docs/superpowers/**"
```

Esperado: sin salidas. `apps/api/README.md` usa `virttend-api` solo como tag de imagen de Docker y queda fuera del alcance a propósito (no está en las rutas del grep).

**Verification:** comandos de los Steps 2 y 3, con los esperados de arriba.

**Commit:**

```powershell
git add Caddyfile
git commit --no-verify -m "fix(deploy): single-origin Caddyfile for client and api"
```

---

### Task 4: CD parametrizado (Environments, `target`, `sha`, checkout exacto)

**Files:**
- Modify: `.github/workflows/cd.yaml`

> **NOTA OBLIGATORIA:** el paso de migración, el health loop y los pasos de pull/`up` del script SSH se copian VERBATIM del `cd.yaml` actual — no reescribirlos de memoria. El bloque `script:` de este paso ya los incluye literalmente (líneas 106-131 del archivo actual), con el único cambio de `git pull --ff-only` por `fetch` + `checkout`. Leer el archivo antes de editar.

- [ ] **Step 1:** Bloque `on:` (líneas 3-6), reemplazar por:

```yaml
on:
  push:
    branches:
      - main
  workflow_dispatch:
    inputs:
      target:
        description: GitHub Environment a desplegar
        required: false
        default: prod
      sha:
        description: Commit sha completo a desplegar (vacío = construir main)
        required: false
        default: ""
```

- [ ] **Step 2:** Concurrency (línea 11), cambiar solo la group:

```yaml
  group: cd-${{ inputs.target || 'prod' }}
```

(el `cancel-in-progress: false` y el comentario de arriba se mantienen).

- [ ] **Step 3:** `env` a nivel de workflow (líneas 18-22), reemplazar por:

```yaml
env:
  # Commit a desplegar: en push = el commit que disparó el workflow; en
  # workflow_dispatch con sha explícito = ese commit (redeploy/rollback).
  DEPLOY_SHA: ${{ inputs.sha || github.sha }}
  # Tag de GHCR a desplegar. Debe coincidir con los tags `type=sha,format=long`
  # que docker/metadata-action genera cuando el commit entra en main.
  IMAGE_TAG: sha-${{ inputs.sha || github.sha }}
```

- [ ] **Step 4:** Job `build`: agregar `if` justo después de `runs-on: ubuntu-latest` (línea 26):

```yaml
    if: ${{ github.event_name == 'push' || inputs.sha == '' }}
```

Y cambiar el `build-args` del build del client (líneas 76-77) — se elimina la dependencia del secreto:

```yaml
          build-args: |
            NEXT_PUBLIC_API_URL=/api
```

- [ ] **Step 5:** Agregar el job `verify-images` nuevo (entre `build` y `deploy`):

```yaml
  verify-images:
    # Solo aplica a workflow_dispatch con sha: esas imágenes se publicaron
    # cuando el commit entró en main (el build se saltea).
    if: ${{ github.event_name == 'workflow_dispatch' && inputs.sha != '' }}
    runs-on: ubuntu-latest

    steps:
      - name: Log in to GHCR
        uses: docker/login-action@v4
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Verify API image exists for IMAGE_TAG
        run: docker manifest inspect "ghcr.io/${{ github.repository }}/api:${{ env.IMAGE_TAG }}"

      - name: Verify client image exists for IMAGE_TAG
        run: docker manifest inspect "ghcr.io/${{ github.repository }}/client:${{ env.IMAGE_TAG }}"
```

- [ ] **Step 6:** Reemplazar el job `deploy` completo (líneas 79-131) por:

```yaml
  deploy:
    needs: [build, verify-images]
    if: ${{ always() && (needs.build.result == 'success' || needs.build.result == 'skipped') && (needs.verify-images.result == 'success' || needs.verify-images.result == 'skipped') }}
    runs-on: ubuntu-latest
    environment: ${{ inputs.target || 'prod' }}

    env:
      GHCR_USERNAME: ${{ secrets.GHCR_USERNAME }}
      GHCR_TOKEN: ${{ secrets.GHCR_TOKEN }}

    steps:
      - name: Deploy to VM via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          envs: IMAGE_TAG,DEPLOY_SHA,GHCR_USERNAME,GHCR_TOKEN
          script: |
            set -euo pipefail

            cd /home/ubuntu/vir-ttend

            git fetch --prune origin
            git -c advice.detachedHead=false checkout --quiet --detach "$DEPLOY_SHA"

            echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin

            export IMAGE_TAG

            # External images plus the freshly pushed app images (compose.ci.yml)
            docker compose -f compose.prod.yml -f compose.ci.yml pull postgres redis caddy api client

            # Infra first; --wait blocks until the healthchecks pass so the
            # migration step below can connect to the database.
            docker compose -f compose.prod.yml -f compose.ci.yml up -d --wait postgres redis

            # Explicit migration step, BEFORE the app containers start.
            # The runner image ships the migration sources (see docs/ci-cd.md).
            docker compose -f compose.prod.yml -f compose.ci.yml run --rm --no-deps \
              api sh -c "cd apps/api && node node_modules/@mikro-orm/cli/cli.js migration:up"

            docker compose -f compose.prod.yml -f compose.ci.yml up -d --wait

            # Belt-and-braces health probe from inside the API container
            for i in $(seq 1 12); do
              if docker compose -f compose.prod.yml -f compose.ci.yml exec -T api \
                wget -q --spider http://localhost:3001/health >/dev/null 2>&1; then
                echo "API health OK"
                break
              fi
              echo "Waiting for API health... ($i/12)"
              sleep 5
            done

            docker compose -f compose.prod.yml -f compose.ci.yml ps
```

Todo lo demás del archivo (`permissions`, comentarios, `steps` del `build`) queda byte-idéntico al actual salvo los cambios de los Steps 1-4.

- [ ] **Step 7:** Self-review del diff: `git diff .github/workflows/cd.yaml` → confirmar que no queda `${{ secrets.NEXT_PUBLIC_API_URL }}`, que `environment:` existe en `deploy`, y que hay tres `if:` (build, verify-images, deploy).

**Verification:**

```powershell
npx --yes js-yaml .github/workflows/cd.yaml | Out-Null
if ($LASTEXITCODE -ne 0) { throw "cd.yaml does not parse" }
rg -n "secrets\.NEXT_PUBLIC_API_URL" .github/workflows/cd.yaml
rg -n "^    (if|environment|needs):" .github/workflows/cd.yaml
```

Esperado: el YAML parsea (exit 0); el primer `rg` no imprime nada; el segundo imprime 5 líneas (3 `if:`, 1 `environment:`, 1 `needs:`).

**Commit:**

```powershell
git add .github/workflows/cd.yaml
git commit --no-verify -m "ci(cd): parametrize deploy target and revision via environments"
```

---

### Task 5: Docs — Environments, alta de instancia, same-origin

**Files:**
- Modify: `docs/ci-cd.md`
- Modify: `doc/deployment-configuration.md:127` y `:179`

**Contexto:** la Task 4 quita el secreto `NEXT_PUBLIC_API_URL` y cambia el deploy a Environments + checkout por sha; los docs deben reflejarlo (spec D2/D4/D8). La referencia a `compose.single-tenant.yml` ya se arregló en la Task 2 — re-verificar.

- [ ] **Step 1:** `docs/ci-cd.md` — diagrama (líneas 5-21): en la línea `CD (on main)` escribir `CD (on main / dispatch)`; en la línea del diagrama que dice `git pull --ff-only` (justo debajo de `SSH to VM (/home/ubuntu/vir-ttend)`) reemplazarla por `git fetch --prune + checkout $DEPLOY_SHA`.

- [ ] **Step 2:** `docs/ci-cd.md` — reemplazar la sección `## Required GitHub Secrets` (líneas 33-45, heading + intro + tabla) por:

````markdown
## Required GitHub Secrets (por GitHub Environment)

Crea un Environment de GitHub llamado `prod` (Settings → Environments → New environment) y agrega estos secretos como **secretos del ambiente**. El workflow de CD puerta el job `deploy` con `environment: prod`, así que cada despliegue resuelve sus credenciales desde el ambiente destino; agregar más environments (p. ej. `staging`) agrega más targets. No se requiere `gh` CLI (usar la web UI).

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
- El `.env` de la VM (`/home/ubuntu/vir-ttend/.env`) lo toca el pipeline: `compose.prod.yml` lo lee igual que antes.
````

- [ ] **Step 3:** `docs/ci-cd.md` — agregar dos secciones nuevas INMEDIATAMENTE después de la sección de secrets (antes de `## Migration step (T3)`):

````markdown
## Despliegue parametrizado (workflow_dispatch)

| Disparador | `target` | `sha` | Comportamiento |
|---|---|---|---|
| Push a `main` | vacío → `prod` | vacío → el commit del push | build + deploy del HEAD de main |
| `workflow_dispatch` | Environment a desplegar (default `prod`) | vacío | build + deploy del HEAD actual de main |
| `workflow_dispatch` | Environment a desplegar | commit sha completo | build saltado; `verify-images` confirma que `sha-<sha>` existe en GHCR; deploy de ese commit |

- Cada environment resuelve sus propios secretos `SSH_*` y `GHCR_*`.
- **Rollback:** Actions → `cd` → Run workflow → `target` = ambiente, `sha` = último commit bueno. El deploy hace `git fetch` + `git checkout --detach` de ese sha y levanta exactamente sus imágenes (`sha-<sha>`).

## Alta de nueva instancia (checklist)

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
4. GitHub: Settings → Environments → crear el ambiente (p. ej. `prod`) con los 5 secretos: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `GHCR_USERNAME`, `GHCR_TOKEN` (PAT `read:packages`).
5. Primer despliegue: Actions → `cd` → Run workflow (`target` = ese ambiente, `sha` vacío) y verificar health + `docker compose ps`.
````

- [ ] **Step 4:** `docs/ci-cd.md` — párrafo `How image tags reach the VM` (línea 91): en la frase que empieza `The deploy job exports IMAGE_TAG=sha-<git sha>`, cambiar "derived from `github.sha`" por "derived from `inputs.sha || github.sha`".

- [ ] **Step 5:** `docs/ci-cd.md` — sección `## Manual deploy (fallback)` (líneas 104-128): reemplazar la línea `git pull --ff-only` por:

```bash
git fetch --prune origin
git -c advice.detachedHead=false checkout --quiet --detach <sha-deseado>
```

Y reemplazar la línea 128, que empieza con "Rollback: point IMAGE_TAG back at the previous", por:

```
Rollback preferido: disparar `cd` por `workflow_dispatch` con el `sha` del último commit bueno (ver "Despliegue parametrizado"). Fallback manual: exportar `IMAGE_TAG=sha-<sha>` y repetir los pasos de pull + `up -d --wait`.
```

- [ ] **Step 6:** `docs/ci-cd.md` — `## Setup checklist (first CD run)` (líneas 130-135): el primer bullet pasa a ser `- [ ] GitHub Environment `prod` creado con `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `GHCR_USERNAME`, `GHCR_TOKEN` como secretos del ambiente` (sin `NEXT_PUBLIC_API_URL`); el bullet del repo en la VM pasa a decir "on `main` (el pipeline hace `checkout --detach` del sha a desplegar) and `compose.ci.yml` present".

- [ ] **Step 7:** `doc/deployment-configuration.md` — línea 127 (bloque env de `apps/client/.env` en el Paso multi), reemplazar:

```env
NEXT_PUBLIC_API_URL=https://api.vir-ttend.app/api/v1
```

por:

```env
# Relativo y same-origin: el reverse proxy expone la API en /api (evita 401 por cookies SameSite)
NEXT_PUBLIC_API_URL=/api
```

- [ ] **Step 8:** `doc/deployment-configuration.md` — línea 179 (bloque env de `apps/client/.env` en el Paso single), reemplazar:

```env
NEXT_PUBLIC_API_URL=https://api-sanmartin.vir-ttend.app/api/v1
```

por:

```env
# Relativo y same-origin: el reverse proxy expone la API en /api (evita 401 por cookies SameSite)
NEXT_PUBLIC_API_URL=/api
```

- [ ] **Step 9:** Confirmar que no quedó ninguna referencia al compose retirado en `doc/deployment-configuration.md` (el §Paso 4 se arregló en la Task 2).

**Verification:**

```powershell
rg -n "compose\.single-tenant|NEXT_PUBLIC_API_URL=https|secrets\.NEXT_PUBLIC_API_URL" docs doc README.md .github --glob "!docs/superpowers/**"
```

Esperado: sin salidas (exit 1 = sin coincidencias). El glob excluye `docs/superpowers/` porque esta planificación y su spec citan esas cadenas a propósito.

**Commit:**

```powershell
git add docs/ci-cd.md doc/deployment-configuration.md
git commit --no-verify -m "docs(cd): environments, instance bootstrap, same-origin api url"
```

---

### Task 6: Reconciliación de la VM + primer deploy

> **BLOQUEADA / GATED:** esta tarea NO se ejecuta hasta que el usuario apruebe el push/PR/merge a `main` (el Step 2 es una decisión del orquestador con el usuario). Los pasos de SSH solo son seguros con las Tasks 1-3 ya mergeadas y pusheadas (spec D10). Los comandos de esta tarea corren en la VM vía SSH (Bash), no en PowerShell local.

**Files:**
- Sin cambios en el repo — el artefacto es este runbook; se ejecuta post-merge.

- [ ] **Step 0 (GitHub UI):** crear el Environment `prod` (Settings → Environments → New environment) y colocar los 5 secretos como secretos **de ambiente**: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `GHCR_USERNAME`, `GHCR_TOKEN` (PAT con scope `read:packages`). No hay `gh` CLI instalado → hacerlo por la web.

- [ ] **Step 1 (VM):** reconciliación. Conectar y revisar primero:

```bash
ssh aws-virttend
cd /home/ubuntu/vir-ttend
git status --porcelain
```

Los 3 `M` (`Caddyfile`, `compose.prod.yml`, `apps/api/src/app.module.ts`) deben corresponder a lo portado en las Tasks 1-3. Recién entonces descartar el drift y limpiar leftovers de compose:

```bash
git checkout -- .                          # descartar drift local (SEGURO solo tras merge+push de Tasks 1-3)
rm -f compose.caddy.yml compose.prod.yml.bak compose.prod.yml.bak2
```

`.env.bak`, `.env.bak2` y `.env.production` están sin trackear y NO son git-ignored:

- `rm -f .env.bak .env.bak2` — ejecutar SOLO tras confirmación del usuario.
- `.env.production` — NO borrar. Inspeccionar (`diff .env.production .env`) y reportarlo al usuario: puede ser un leftover; la decisión queda pendiente.

Ajustar `.env` (el `.env` de la VM ya define `POSTGRES_PASSWORD_URL`/`REDIS_PASSWORD_URL`; NUNCA imprimir su contenido en logs):

```bash
sed -i 's|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=/api|' .env
grep -q '^VIR_DOMAIN=' .env || echo 'VIR_DOMAIN=virttend.duckdns.org' >> .env
```

Validar la config antes de cualquier deploy:

```bash
docker compose -f compose.prod.yml config >/dev/null && echo CONFIG_OK
```

Esperado: `CONFIG_OK`.

- [ ] **Step 2 (GATED — decisión del usuario):** push de `feat/single-deploy-target`, apertura de PR y merge a `main`. Preguntar al usuario; sin `gh` CLI se hace por la web. NO hacer push por cuenta propia.

- [ ] **Step 3 (primer deploy):** Actions → `cd` → Run workflow con `target=prod` y `sha` vacío. (Si el push a `main` ya dispara el workflow, observar ese run; este dispatch sirve para re-ejecutar o cuando no haya disparador.) Observar en el log: el paso de migración (7 migraciones, idempotente), el health loop (`API health OK`) y `docker compose ps` al final.

- [ ] **Step 4 (aceptación):**

```bash
curl -s https://virttend.duckdns.org/api/health
docker ps --filter "name=vir-ttend_"
```

Esperado: el health devuelve estado healthy y `docker ps` muestra los 5 contenedores `vir-ttend_{postgres,redis,api,client,caddy}`. Además, en el navegador: el sitio carga por HTTPS y en la pestaña de red no hay llamadas a orígenes distintos del dominio.

**Verification:** los comandos de los Steps 1 y 4 con sus esperados.

**Commit:** n/a — runbook ejecutado post-merge; este documento es el artefacto (sin cambios de repo en la Task 6).
