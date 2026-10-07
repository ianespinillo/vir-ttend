# Bootstrap de VM: de cero a instanciaVir-ttend operativa

Guía paso a paso para aprovisionar una VM Ubuntu, instalar Docker, configurar DNS y `.env`, crear el Environment `prod` de GitHub y ejecutar el primer deploy del pipeline CD. Al terminar, la instancia sirve `https://<dominio>` con client y API bajo un solo origen.

> **Regla de seguridad:** nunca pegues valores reales de secretos en este archivo, en commits ni en logs. Todo lo marcado con `<...>` es un placeholder.

## Quick path

1. Aprovisionar la VM (Ubuntu 24.04, puertos 22/80/443) y habilitar acceso SSH.
2. Instalar Docker Engine + Compose v2 y clonar el repo en `/home/ubuntu/vir-ttend`.
3. Apuntar el DNS y crear `/home/ubuntu/vir-ttend/.env`.
4. Crear el Environment `prod` en GitHub con sus 5 secretos.
5. Deploy por Actions y verificar con el checklist del final.

## 1. Prerrequisitos

| Recurso | Detalle |
|---------|---------|
| Cuenta cloud | Proveedor con permiso para crear VMs y abrir puertos (AWS, GCP, Azure, DigitalOcean, etc.) |
| Dominio | Dominio con acceso de escritura a su zona DNS |
| Terminal local | `ssh` y `ssh-keygen` disponibles (Linux/macOS/WSL o PowerShell) |
| GitHub | Permisos de administrador del repo (para Settings → Environments) |

## 2. Aprovisionar la VM

- **SO:** Ubuntu 24.04 LTS.
- **Tamaño mínimo:** 2 vCPU / 4 GB RAM (suficiente para las 5 imágenes del stack).
- **Security group / firewall:** abrir los puertos **22** (SSH), **80** (HTTP) y **443** (HTTPS).
- Anotar la **IP pública** resultante: se usa en el DNS (paso 6) y en el secreto `SSH_HOST` (paso 8).

## 3. Acceso SSH inicial

Generar en la máquina local un par de claves ed25519 (si aún no existe):

```bash
ssh-keygen -t ed25519 -C "operator" -f ~/.ssh/id_ed25519
```

Publicar la clave pública en la VM. Opción A, con la clave temporal del proveedor:

```bash
ssh ubuntu@<ip-publica>
echo '<clave-publica-ed25519>' >> ~/.ssh/authorized_keys
```

Opción B, vía consola web del proveedor: pegar la clave pública en `~/.ssh/authorized_keys` del usuario `ubuntu`.

Verificar el acceso sin contraseña:

```bash
ssh ubuntu@<ip-publica>
```

## 4. Instalar Docker Engine + Compose v2

Comandos oficiales para Ubuntu (repositorio `download.docker.com`):

```bash
# Eliminar paquetes en conflicto
for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do
  sudo apt-get remove -y "$pkg"
done

sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Permitir docker sin sudo (requiere cerrar y volver a entrar)
sudo usermod -aG docker ubuntu
```

Verificación:

```bash
docker compose version
```

Esperado: imprime `Docker Compose version v2.x.x` (la versión 2 confirma el plugin correcto).

## 5. Clonar el repo

El pipeline espera el repo exactamente en esta ruta:

```bash
git clone <url-del-repo> /home/ubuntu/vir-ttend
cd /home/ubuntu/vir-ttend
```

Si el repo es privado, autenticar el clone con una clave SSH registrada en GitHub o con un token de acceso; el pull de imágenes de GHCR se configura por separado (paso 8).

## 6. DNS

Crear en la zona DNS del dominio un registro:

| Tipo | Nombre | Valor |
|------|--------|-------|
| A | `<dominio>` (o `@`) | IP pública de la VM |

Esperar la propagación (TTL bajo ayuda durante el setup). Caddy solo emite certificados Let's Encrypt si el dominio resuelve hacia la VM por los puertos 80/443.

## 7. Archivo `.env`

Crear `/home/ubuntu/vir-ttend/.env` con la plantilla completa. Todas las claves listadas las consume `compose.prod.yml` (directamente o por interpolación).

```bash
cd /home/ubuntu/vir-ttend
nano .env      # o vim .env
chmod 600 .env
```

Generar valores fuertes (uno por clave marcada):

```bash
openssl rand -base64 32
```

Plantilla completa:

```env
# === PostgreSQL ===
POSTGRES_USER=virttend
POSTGRES_DB=virttend
POSTGRES_PASSWORD=<GENERAR: openssl rand -base64 32>
# Variante URL-encoded de POSTGRES_PASSWORD; se usa SOLO en DATABASE_URL
POSTGRES_PASSWORD_URL=<percent-encode de POSTGRES_PASSWORD>

# === Redis ===
REDIS_PASSWORD=<GENERAR: openssl rand -base64 32>
# Variante URL-encoded de REDIS_PASSWORD; se usa SOLO en REDIS_URL
REDIS_PASSWORD_URL=<percent-encode de REDIS_PASSWORD>

# === API ===
JWT_SECRET=<GENERAR: openssl rand -base64 32>
JWT_REFRESH_SECRET=<GENERAR: openssl rand -base64 32>
CORS_ORIGINS=https://<dominio>

# === Tenancy (single-tenant) ===
# TENANCY_MODE=single va fijo en compose.prod.yml; NO definirlo aquí.
TENANT_ID=<uuid estable del tenant>
TENANT_SLUG=<slug del tenant>
TENANT_NAME=<nombre del tenant>
SCHOOL_NAME=<nombre de la escuela>
SCHOOL_LEVELS=PRIMARY,SECONDARY
BOOTSTRAP_ADMIN_EMAIL=<email del administrador bootstrap>
BOOTSTRAP_ADMIN_FIRST_NAME=<nombre>
BOOTSTRAP_ADMIN_LAST_NAME=<apellido>
BOOTSTRAP_ADMIN_PASSWORD=<GENERAR: openssl rand -base64 32>
ALLOW_SUPERADMIN=false

# === Client (build de Next.js) ===
NEXT_PUBLIC_API_URL=/api

# === Caddy (reverse proxy) ===
VIR_DOMAIN=<dominio>
```

Notas importantes:

- **URL-encoding de passwords:** `openssl rand -base64 32` produce caracteres `+`, `/` y `=` que rompen `DATABASE_URL`/`REDIS_URL` dentro de una URL. Los valores crudos (`POSTGRES_PASSWORD`, `REDIS_PASSWORD`) van tal cual a los contenedores; las variantes `_URL` deben ir percent-encoded (`+` → `%2B`, `/` → `%2F`, `=` → `%3D`). Helper en la VM:

  ```bash
  printf '%s' "$POSTGRES_PASSWORD" | python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.stdin.read(), safe=''))"
  ```

- **`NEXT_PUBLIC_API_URL=/api`:** valor relativo y same-origin (el reverse proxy expone la API en `/api`); es idéntico en todas las instancias.
- **`VIR_DOMAIN` y `CORS_ORIGINS=https://<dominio>`:** usan el mismo dominio del registro A del paso 6.
- **`SCHOOL_LEVELS`:** tiene default `PRIMARY,SECONDARY` en el compose; puede omitirse si aplica.
- **Validar antes de cualquier deploy:**

  ```bash
  docker compose -f compose.prod.yml config >/dev/null && echo CONFIG_OK
  ```

  Esperado: `CONFIG_OK` (un error `variable is not set` indica la clave faltante).

## 8. Environment `prod` en GitHub

En el repo: **Settings → Environments → New environment** → nombre `prod`. Agregar estos 5 secretos como secretos **del ambiente**:

| Secreto | Valor |
|---------|-------|
| `SSH_HOST` | IP pública (o hostname) de la VM |
| `SSH_USER` | Usuario SSH en la VM (p. ej. `ubuntu`) |
| `SSH_PRIVATE_KEY` | Clave privada de un **par dedicado para CI** (ver abajo) |
| `GHCR_USERNAME` | Usuario de GitHub para el login a GHCR **desde la VM** |
| `GHCR_TOKEN` | PAT de GitHub con scope `read:packages` |

Par dedicado de CI para `SSH_PRIVATE_KEY` (se separa de la clave del operador):

```bash
# En la máquina local
ssh-keygen -t ed25519 -f ~/.ssh/ci_deploy -C "ci-deploy"
# pubkey → agregar a ~/.ssh/authorized_keys de la VM
# privada → pegar como valor del secreto SSH_PRIVATE_KEY (borrar el archivo temporal después)
```

La clave privada nunca se versiona ni se imprime en logs.

## 9. Primer deploy

1. **Actions → `cd` → Run workflow.**
2. Seleccionar `target=prod` y dejar `sha` vacío → **Run workflow**.
3. Observar en el log: el paso de migraciones, el health loop (`API health OK`) y el `docker compose ps` final.

Verificación en la VM:

```bash
cd /home/ubuntu/vir-ttend

docker compose -f compose.prod.yml -f compose.ci.yml ps
docker compose -f compose.prod.yml -f compose.ci.yml logs --tail=100 api
docker compose -f compose.prod.yml -f compose.ci.yml logs --tail=100 caddy

curl -s https://<dominio>/api/health
```

Esperado:

- `ps` muestra los 5 contenedores `vir-ttend_{postgres,redis,api,client,caddy}` en estado `running` (o `healthy`).
- `curl` responde `{"status":"ok","timestamp":"...","version":"..."}`.
- Abrir `https://<dominio>` en el navegador: el sitio carga con certificado HTTPS y la app llama a la API en el mismo origen (`/api`).

## 10. Troubleshooting

| Síntoma | Qué revisar |
|---------|-------------|
| Sin certificado HTTPS / Caddy no emite cert | DNS apuntando a la VM, puertos 80/443 abiertos: `docker compose -f compose.prod.yml -f compose.ci.yml logs caddy` |
| API no responde / 5xx | Logs de la API: `... logs api`; estado: `... ps` |
| Errores de esquema en el arranque | Correr migraciones a mano (mismo comando del pipeline):<br>`docker compose -f compose.prod.yml -f compose.ci.yml run --rm --no-deps api sh -c "cd apps/api && node node_modules/@mikro-orm/cli/cli.js migration:up"` |
| Contenedor en restart-loop | `... ps` + `... logs <servicio>`; revisar healthcheck y `.env` (`docker compose -f compose.prod.yml config`) |
| `variable is not set` al levantar | Falta una clave del paso 7 en `.env` |

Para operación continua (deploys por commit, deploy por `sha`, rollback) ver [`docs/ci-cd.md`](./ci-cd.md).

## Checklist

- [ ] `ssh ubuntu@<ip-publica>` entra sin contraseña con la clave del operador.
- [ ] `docker compose version` imprime v2.x.x en la VM.
- [ ] Repo clonado en `/home/ubuntu/vir-ttend`.
- [ ] Registro A resuelve `<dominio>` → IP pública.
- [ ] `.env` completo (todas las claves del paso 7) con `chmod 600`.
- [ ] Environment `prod` creado con los 5 secretos.
- [ ] Run de `cd` en verde; `docker compose ps` con los 5 contenedores.
- [ ] `https://<dominio>/api/health` responde `status: ok` y el sitio carga por HTTPS.

## Next step

Operación continua, despliegue parametrizado y rollback: [`docs/ci-cd.md`](./ci-cd.md).
