# Diseño: Single Deploy Target — un deploy canónico, instancias como targets baratos

| Campo | Valor |
|---|---|
| **Fecha** | 2026-10-07 |
| **Rama** | `feat/single-deploy-target` |
| **Plan de implementación** | `docs/superpowers/plans/2026-10-07-single-deploy-target.md` |
| **Estado** | Propuesta A aprobada por el usuario |

## 1. Contexto y problema

El repo y la VM de producción (`aws-virttend`, `/home/ubuntu/vir-ttend`) divergieron: la VM corre parches locales sin commitear (`Caddyfile`, `compose.prod.yml`, `app.module.ts`), mientras el repo mantiene versiones que ya no reflejan lo que realmente corre en prod. Cada corrección manual en la VM es deuda: el próximo deploy del pipeline revertiría los hotfix. Al mismo tiempo conviven dos defines de compose de producción (`compose.prod.yml` y `compose.single-tenant.yml`) que divergen en variables y defaults, y el pipeline anterior solo soportaba un destino fijo, sin posibilidad de redeploy/rollback por revisión.

Tercer punto, el del 401: el client llama a la API con un origen absoluto horneado en la imagen (`NEXT_PUBLIC_API_URL` con valor HTTPS completo). Bajo el modelo de dos dominios la petición es cross-origin y las cookies de sesión (SameSite) no se envían, produciendo 401; además el origen absoluto obliga a hornear una imagen distinta por instancia aunque el código sea idéntico.

Objetivo (propuesta A aprobada): UNA definición canónica de despliegue (compose + Caddy + pipeline CD) parametrizada, donde cada instancia sea un target barato: misma forma de VM, mismo `.env` por instancia, mismas imágenes por commit, aislamiento vía `TENANCY_MODE=single` + una pila por VM.

## 2. Hechos verificados (2026-10-07)

| ID | Hecho | Evidencia |
|---|---|---|
| F1 | La VM corre un `compose.prod.yml` modificado localmente: `DATABASE_URL` usa `${POSTGRES_PASSWORD_URL}` y `REDIS_URL` usa `${REDIS_PASSWORD_URL}` (el password de prod es base64 y rompe una URL cruda). El repo (`compose.prod.yml:42-43`) aún usa `${POSTGRES_PASSWORD}`/`${REDIS_PASSWORD}` crudos: la versión del repo está rota para el `.env` de prod. Hay que portarlo. | `git diff` en la VM (HEAD local `41a666d`) + lectura del repo |
| F2 | La VM tiene un `Caddyfile` de un solo origen: bloque único con `handle_path /api/* { reverse_proxy api:3001 }` + `reverse_proxy client:3000`. El `Caddyfile` del repo está obsoleto: dos dominios separados (`virttend.duckdns.org` → client, `virttend-api.duckdns.org` → api), sin `handle_path`. Hay que portarlo. | `git diff` en la VM vs `Caddyfile:7-13` del repo |
| F3 | La VM tiene un hotfix local en `apps/api/src/app.module.ts`: `allowGlobalContext: true` dentro de las opciones de `MikroOrmModule.forRootAsync` (justo después de `autoLoadEntities: true`). El repo (`app.module.ts:22-33`) NO lo tiene: el primer deploy del pipeline revertiría el hotfix de prod. El flag ya existe en `mikro-orm.config.ts:25` y en `scripts/seed.ts:641` (config CLI), pero `app.module.ts` inicializa MikroORM inline. | `git diff` en la VM; grep del repo (`allowGlobalContext` → solo 2 hits, ninguno en `app.module.ts`) |
| F4 | Estado git de la VM: modificados `Caddyfile`, `compose.prod.yml`, `apps/api/src/app.module.ts`; sin trackear: `.env.bak`, `.env.bak2`, `.env.production`, `compose.caddy.yml`, `compose.prod.yml.bak`, `compose.prod.yml.bak2`. `.env` está git-ignored (confirmado). La stack corre SOLO desde `compose.prod.yml`. | `git status` en la VM |
| F5 | Los nombres de contenedor son idénticos repo/VM: `vir-ttend_{postgres,redis,api,client,caddy}` — 5 contenedores arriba. | `docker ps` en la VM vs `compose.prod.yml` |
| F6 | `NEXT_PUBLIC_API_URL` se hornea en build time (`apps/client/Dockerfile:28` — `ARG NEXT_PUBLIC_API_URL`; `packages/hooks/src/lib/axios-client.ts:7` — fallback `process.env.NEXT_PUBLIC_API_URL`). El `.env` de la VM tiene la URL absoluta `https://virttend.duckdns.org/api`. Estándar propuesto: relativo `/api` (same-origin). | Lectura de archivos + `.env` de la VM |
| F7 | Repo `compose.prod.yml` actual: `TENANCY_MODE: single` hardcodeado (línea 48), `INSTANCE_ID: ${TENANT_SLUG}` (línea 59), `NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}` SIN default (líneas 78 y 84), servicio `caddy` sin bloque `environment`, sin `VIR_DOMAIN` en ninguna parte. | Lectura de `compose.prod.yml` |
| F8 | Repo local: worktree limpio sobre `main` en `3d97fb8` (feature ci-cd-pipeline commiteada localmente, NO pusheada; no hay `gh` CLI instalado). Push/PR es decisión del usuario. | `git status` / `git log` locales |
| F9 | Feature anterior (commit `3d97fb8`) agregó: `.github/workflows/cd.yaml` (build → imágenes GHCR `ghcr.io/ianespinillo/vir-ttend/{api,client}` con tags `sha-<full>` + `latest`; deploy vía `appleboy/ssh-action@v1` con concurrency, `git pull --ff-only` y paso explícito de migración MikroORM), `compose.ci.yml` (override de `image:` a `ghcr.io/ianespinillo/vir-ttend/api:${IMAGE_TAG:-latest}`), `.github/workflows/ci.yaml` (`branches-ignore: [main, dev]`) y `docs/ci-cd.md`. | Lectura de los 4 archivos |
| F10 | El API NO tiene prefijo global (`apps/api/src/main.ts` nunca llama a `setGlobalPrefix`): `handle_path /api/*` funciona tal cual. CORS sale de `CORS_ORIGINS` (`main.ts` / `app.config.ts`). | Grep `setGlobalPrefix` en `apps/api/src` → 0 hits |
| F11 | `apps/client/src/app/(dashboard)/layout.tsx` es `'use client'` y lee `tenancyMode` del config runtime (`/config/public` vía `usePublicConfig()`) con fallback a env: el modo de tenancy NO está horneado; una imagen sirve `multi` y `single`. | Lectura del layout + hook de config pública |
| F12 | `compose.single-tenant` solo se referencia en `README.md:77` y `doc/deployment-configuration.md:189,192`. `virttend-api` como DOMINIO solo está en el `Caddyfile` del repo (línea 11); `apps/api/README.md:95,104` lo usa como tag de imagen de Docker: NO tocar. | Grep en todo el repo |
| F13 | Ningún archivo `.env*`, `.md` ni `.yml` del repo documenta `POSTGRES_PASSWORD_URL`/`REDIS_PASSWORD_URL` (0 hits). | Grep en md/yml/example |
| H1 | Hallazgo al escribir este diseño: `.env.production.example:52` YA define `NEXT_PUBLIC_API_URL` con un valor absoluto de ejemplo. Hay que REEMPLAZAR ese valor por `/api`, no agregar una clave duplicada. (El archivo es de solo lectura por permisos; verificado vía grep.) | Grep de `.env.production.example` |

## 3. Decisiones de diseño

- **D1 — Un solo par de imágenes por commit.** Todas las instancias corren las MISMAS imágenes (`ghcr.io/ianespinillo/vir-ttend/{api,client}` con `sha-<full>` + `latest`). *Rationale:* una sola variable de verdad; rollback = redeploy de un sha. *Tradeoff:* el build no puede parametrizarse por instancia, así que toda configuración por instancia vive en runtime (`.env`, compose), nunca en build args variables.

- **D2 — `NEXT_PUBLIC_API_URL=/api` relativo (same-origin).** Build-arg fijo en CI, default `${NEXT_PUBLIC_API_URL:-/api}` en compose, `.env` de la VM cambiado a `/api`. Se elimina el secreto `NEXT_PUBLIC_API_URL` de GitHub. *Rationale:* mismo origen → las cookies SameSite se envían en las llamadas fetch (fix del 401) y UNA imagen sirve a todas las instancias. *Tradeoff:* la API debe exponerse bajo el mismo dominio (ya es así vía `handle_path`) y se pierde la posibilidad de apuntar a un host API separado, modelo que además era la causa del problema.

- **D3 — `compose.prod.yml` es el único compose canónico.** Se elimina `compose.single-tenant.yml` y se actualizan sus referencias (`README.md:77`, `doc/deployment-configuration.md` §Paso 4). *Rationale:* una sola definición parametrizable; las dos variantes ya divergían. *Tradeoff:* diff de delete que hay que revisar, y los docs pierden (temporalmente) el ejemplo de "compose distinto por tenant", que era ilusorio.

- **D4 — CD parametrizado con GitHub Environments.** Push a `main` despliega el ambiente `prod`; `workflow_dispatch` acepta `target` (ambiente, default `prod`) y `sha` (commit completo, opcional → redeploy/rollback). Secretos por ambiente: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `GHCR_USERNAME`, `GHCR_TOKEN` (PAT con `read:packages` para el pull de GHCR desde la VM). El build usa `GITHUB_TOKEN` con `permissions: packages: write`. *Rationale:* aislamiento de credenciales por target y despliegues controlados. *Tradeoff:* alta manual de ambientes en la UI (no hay `gh` CLI).

- **D5 — Aislamiento = una pila por VM + `TENANCY_MODE=single` + DB propia** (`.env` por instancia). *REVISIÓN de una idea anterior:* NO se parametriza `container_name`. Renombrar contenedores no aporta nada hoy (una pila por VM, F5) y rompe la memoria operativa de quien hace `docker ps` o lee logs. Dos stacks en una VM queda explícitamente fuera de alcance.

- **D6 — Branding runtime por instancia (vía public config): FUERA de alcance.** Se anota como trabajo futuro; no bloquea nada de este diseño.

- **D7 — Caddy parametrizado con `{$VIR_DOMAIN}`**, inyectado por compose (`VIR_DOMAIN: ${VIR_DOMAIN:-virttend.duckdns.org}`), un solo bloque de sitio (single origin); se elimina el bloque del segundo dominio. Verificado antes de decidir: no hay otras referencias al dominio `-api` fuera del `Caddyfile` (F12).

- **D8 — Dispatch con `sha` explícito: build saltado, imágenes verificadas, checkout exacto.** Esas imágenes se publicaron cuando el commit entró a `main`; el job `verify-images` las chequea con `docker manifest inspect` y el script de deploy hace `git fetch --prune origin` + `git checkout --quiet --detach "$DEPLOY_SHA"` EN LUGAR de `git pull --ff-only` (rollback real y tolera estado detached). Los `if` de los jobs tratan `skipped` como aceptable: `always() && (needs.build.result == 'success' || needs.build.result == 'skipped') && (needs.verify-images.result == 'success' || needs.verify-images.result == 'skipped')`. *Tradeoff:* redeploy de commits previos al pipeline no tiene imágenes publicadas; `verify-images` lo detecta con un error claro antes de tocar la VM.

- **D9 — Semántica de inputs.** `workflow_dispatch` con `sha` vacío construye y despliega el HEAD actual de `main`. En eventos `push`, `inputs.*` evalúa vacío → `environment: ${{ inputs.target || 'prod' }}` y a nivel de workflow `DEPLOY_SHA`/`IMAGE_TAG` = `sha-${{ inputs.sha || github.sha }}`.

- **D10 — La VM se reconcilia ANTES del primer deploy del pipeline.** El repo no adopta un deploy con `git pull` sobre drift: la VM tiene que quedar limpia (los 3 archivos con drift ya fueron portados al repo por las Tasks 1-3, y los leftovers sin trackear se retiran) como tarea con gate posterior al push. Es la garantía de que el pipeline despliega exactamente lo que se revisó.

## 4. Alcance / Fuera de alcance

**En alcance:**

- Hotfix `allowGlobalContext` portado al repo (`app.module.ts`).
- `compose.prod.yml` como compose canónico (defaults `_URL`, default `/api`, `VIR_DOMAIN`), retiro de `compose.single-tenant.yml` y sus referencias en docs.
- `Caddyfile` canónico de un solo origen con `handle_path /api/*` parametrizado por `{$VIR_DOMAIN}`.
- `cd.yaml` parametrizado: `workflow_dispatch` (`target`, `sha`), GitHub Environments, `verify-images`, checkout exacto del sha en la VM.
- Documentación: `docs/ci-cd.md` y `doc/deployment-configuration.md`.
- Runbook de reconciliación de la VM + primer deploy (Task 6, con gate de usuario).

**Fuera de alcance:**

- Branding runtime por instancia (D6) — trabajo futuro.
- Dos o más stacks de la misma instancia en una VM (D5).
- Migración de datos entre instancias.
- Cambios de código de negocio / aplicación (más allá del flag MikroORM).
- Renombrado de contenedores (`container_name` parametrizado) — decisión revertida en D5.
- El modo multi-tenant SaaS centralizado queda tal como está.

## 5. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Si se omite la reconciliación de la VM (D10), el primer deploy revierte los 3 archivos con drift (hotfix de prod perdido). | Task 6 con gate explícito: solo después de merge+push de las Tasks 1-3; comandos exactos de `git checkout -- .` + retiro de leftovers. |
| Redeploy de un commit anterior al pipeline: sus imágenes nunca se publicaron en GHCR. | Job `verify-images` (`docker manifest inspect`) falla con mensaje claro ANTES de tocar la VM. |
| `.env.production` sin trackear y sin git-ignorar en la VM: puede ser un leftover con datos o basura. | NO se borra sin confirmación; se inspecciona y la decisión queda con el usuario. |
| `GHCR_TOKEN` con scope de más o de menos: el pull en la VM requiere PAT con `read:packages`. | Secretos documentados con su scope exacto en `docs/ci-cd.md`; PAT solo para pull. |
| Al pasar de dos dominios a uno, el certificado TLS y el DNS del subdominio `-api` quedan huérfanos. | Verificación post-deploy: solo se sirve el dominio principal; si nada apunta al subdominio, se puede dar de baja después. |

## 6. Criterios de aceptación

- `docker compose --env-file .env.production.example -f compose.prod.yml config` sale con código 0 y el render contiene `POSTGRES_PASSWORD_URL`, `VIR_DOMAIN` y `NEXT_PUBLIC_API_URL: /api`.
- `rg -n "compose\.single-tenant" .` sin hits fuera de `docs/superpowers/` (los artefactos de este cambio lo mencionan a propósito).
- Caddyfile same-origin validado (`caddy validate` → "Valid configuration") y sin referencias al dominio `-api` (salvo el tag de imagen en `apps/api/README.md`, que no se toca).
- `cd.yaml` parsea como YAML; `environment:` gating el deploy; los tres `if:` (build, verify-images, deploy) presentes; cero referencias a `secrets.NEXT_PUBLIC_API_URL`.
- Docs actualizados: greps de `compose.single-tenant` / `NEXT_PUBLIC_API_URL=https` / `secrets.NEXT_PUBLIC_API_URL` en `docs`, `doc`, `README.md`, `.github` en cero (excluyendo `docs/superpowers/`).
- `pnpm run ts:check` en verde con `allowGlobalContext` portado.
- Primer deploy en la VM: `curl -s https://virttend.duckdns.org/api/health` devuelve healthy, `docker ps` muestra los 5 contenedores `vir-ttend_*` y el sitio carga por HTTPS sin llamadas a orígenes distintos.
