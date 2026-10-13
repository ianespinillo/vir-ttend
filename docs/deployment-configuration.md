# Guía de Configuración según Tipo de Despliegue (Multi-Tenant vs Single-Tenant)

Esta guía detalla cómo configurar, desplegar y operar la plataforma según el modelo de aislamiento requerido: **SaaS Multi-Tenant Centralizado** o **Instancia Aislada Single-Tenant**, utilizando un único repositorio y la misma base de código.

---

## 1. Visión General de la Arquitectura

El sistema implementa una arquitectura dual gobernada por la variable `TENANCY_MODE`:

```mermaid
flowchart TD
    subgraph MultiTenant ["Modo Multi-Tenant (SaaS)"]
        ReqM["Request entrante (*.vir-ttend.app)"]
        ResM["TenantMiddleware: resuelve por subdominio"]
        AuthM["Auth: Login -> Select Tenant -> Sesión"]
        DBM[("Base de Datos Compartida")]
        RedisM[("Redis Compartido")]
        ReqM --> ResM --> AuthM --> DBM
        ResM --> RedisM
    end

    subgraph SingleTenant ["Modo Single-Tenant (Aislado)"]
        ReqS["Request entrante (colegio.edu.ar)"]
        ResS["TenantMiddleware: resuelve por TENANT_ID fijo"]
        AuthS["Auth: Login directo -> Sesión"]
        BootS["Bootstrap: Auto-crea Tenant y Admin"]
        DBS[("Base de Datos Dedicada")]
        RedisS[("Redis Dedicado o Prefijado")]
        ReqS --> ResS --> AuthS --> DBS
        ResS --> RedisS
        BootS --> DBS
    end
```

### Principio Fundamental: Codebase Único
Ambos modos ejecutan exactamente las mismas migraciones de base de datos, las mismas entidades de MikroORM y la misma lógica de dominio. Ninguna columna ni clave foránea (`tenantId`) se elimina o altera; la diferencia radica exclusivamente en cómo se resuelve y restringe el contexto del tenant en tiempo de ejecución.

---

## 2. Comparativa entre Modos

| Dimensión | Modo `multi` (SaaS compartido) | Modo `single` (Instancia aislada) |
|---|---|---|
| **Valor de `TENANCY_MODE`** | `multi` (o no definido por defecto) | `single` |
| **Resolución de Tenant** | Dinámica mediante subdominio en URL o encabezado HTTP | Fija y directa desde `TENANT_ID` en variables de entorno |
| **Base de Datos** | Compartida entre todos los colegios | Dedicada y exclusiva para la institución |
| **Aislamiento en Redis** | Compartido con llaves estándar | Prefijo aislado configurable (`INSTANCE_ID` o `TENANT_SLUG`) |
| **Flujo de Autenticación** | `POST /auth/login` requiere posterior `POST /auth/select-tenant` | `POST /auth/login` emite cookies de sesión directamente |
| **Superadmin Global** | Habilitado para gestión de la plataforma | Deshabilitado por defecto (`ALLOW_SUPERADMIN=false`) |
| **Interfaz de Usuario** | Muestra selector de colegios y gestión `/tenants` | Oculta selector de colegios y restringe acceso a `/tenants` |
| **Arranque Inicial** | Colegios creados mediante panel o API administrativa | Auto-bootstrap idempotente crea el Tenant y usuario ADMIN |
| **App móvil** | App general (variante `general`); el usuario elige colegio tras el login si pertenece a varios | App propia del colegio (una variante por colegio); entra directo al colegio configurado |

---

## 3. Matriz de Variables de Entorno

### 3.1 Variables Compartidas (Obligatorias en Producción)

| Variable | Descripción | Ejemplo / Valor |
|---|---|---|
| `NODE_ENV` | Entorno de ejecución (`development`, `test`, `production`) | `production` |
| `PORT` | Puerto de escucha del backend NestJS | `3001` |
| `DATABASE_URL` | Cadena de conexión PostgreSQL | `postgresql://user:pass@host:5432/dbname` |
| `REDIS_URL` | URL de conexión al servidor Redis | `redis://host:6379` |
| `JWT_SECRET` | Secreto para firma de access tokens (mínimo 32 caracteres) | `mi_clave_secreta_jwt_produccion_123` |
| `JWT_REFRESH_SECRET` | Secreto para refresh tokens (**debe ser distinto a `JWT_SECRET`**) | `mi_clave_secreta_refresh_produccion_456` |
| `CORS_ORIGINS` | Orígenes autorizados separados por coma | `https://colegio.edu.ar,https://admin.colegio.edu.ar` |

> [!IMPORTANT]
> **Validación Fail-Fast en Producción:**
> Al iniciar en `NODE_ENV=production`, la aplicación verificará que:
> 1. `JWT_SECRET` y `JWT_REFRESH_SECRET` estén definidos y **no sean iguales**.
> 2. No se utilicen secretos por defecto de prueba (e.g. `secret`, `123456`, `default_jwt_secret`).
> 3. `DATABASE_URL` y `REDIS_URL` estén explícitamente configurados.
> Si alguna validación falla, el servidor se detendrá inmediatamente arrojando un error explicativo.

### 3.2 Variables de Tenancy

| Variable | Requerida en `multi` | Requerida en `single` | Descripción |
|---|---|---|---|
| `TENANCY_MODE` | No (default `multi`) | **Sí** | Debe establecerse en `single`. |
| `TENANT_ID` | No | **Sí** | UUID v4 que identifica a la institución en la base de datos. |
| `TENANT_SLUG` | No | **Sí** | Identificador en formato slug (e.g. `colegio-nacional`). |
| `TENANT_NAME` | No | Opcional (recomendada) | Nombre institucional legible para reportes y logs. La app móvil lo muestra como nombre del colegio (vía `/config/public`). |
| `ALLOW_SUPERADMIN` | No (default `true`) | Opcional (default `false`) | Si es `false`, ningún usuario con rol `SUPERADMIN` puede autenticarse. |
| `INSTANCE_ID` | No | Opcional | Identificador de instancia para prefijar claves en Redis compartidos. |

### 3.3 Variables de Auto-Bootstrap (Exclusivas de Modo `single`)

Al levantar la instancia por primera vez con una base de datos limpia, el servicio de bootstrap crea automáticamente el tenant y la cuenta administrativa:

| Variable | Requerida | Valor por Defecto | Descripción |
|---|---|---|---|
| `BOOTSTRAP_ADMIN_EMAIL` | No | `admin@${TENANT_SLUG}.edu.ar` | Correo electrónico del usuario administrador inicial. |
| `BOOTSTRAP_ADMIN_PASSWORD` | No | *Generado aleatoriamente* | Contraseña inicial. Debe cumplir requisitos de complejidad (mayúscula, minúscula, número y símbolo, mín. 8 caracteres). |
| `BOOTSTRAP_ADMIN_FIRST_NAME` | No | `Administrador` | Nombre del administrador inicial. |
| `BOOTSTRAP_ADMIN_LAST_NAME` | No | `Institucional` | Apellido del administrador inicial. |

> [!TIP]
> Si no defines `BOOTSTRAP_ADMIN_PASSWORD`, el sistema generará una contraseña criptográfica aleatoria y la imprimirá en los logs de la consola en un banner visible al arrancar.

### 3.4 Variables de Marca (solo modo `single`)

| Variable | Dónde se define | Descripción |
|---|---|---|
| `BRANDING_SLUG` | `.env` de la VM (lo lee `compose.prod.yml`) | Carpeta de `deploy/branding/` que se monta en la instancia (ej. `eest3`). Vacía equivale a `_none`: marca Vir-ttend. |
| `BRANDING_DIR` | API (`compose.prod.yml` la fija en `/app/branding`) | Carpeta con `branding.json` y los assets. En desarrollo local, por ejemplo `../../deploy/branding/eest3` junto con `TENANCY_MODE=single`. |

Ver [Paso 6: Marca de la instancia](#paso-6-marca-de-la-instancia-opcional).

---

## 4. Configuración Paso a Paso: Modo Multi-Tenant (SaaS)

Este modo se utiliza para el despliegue principal de la plataforma (`vir-ttend.app`), atendiendo a múltiples colegios sobre una base de datos centralizada con resolución dinámica.

### Paso 1: Configurar variables de entorno (`.env`)

En `apps/api/.env`:
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://virttend_saas:password@postgres.internal:5432/virttend_saas
REDIS_URL=redis://redis.internal:6379
JWT_SECRET=super_seguro_access_secret_produccion_saas_2026
JWT_REFRESH_SECRET=super_seguro_refresh_secret_produccion_saas_2026
CORS_ORIGINS=https://vir-ttend.app,https://*.vir-ttend.app

# Tenancy: modo multi explícito (o ausente)
TENANCY_MODE=multi
```

En `apps/client/.env`:
```env
# Relativo y same-origin: el reverse proxy expone la API en /api (evita 401 por cookies SameSite)
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_APP_DOMAIN=vir-ttend.app
```

### Paso 2: Ejecutar migraciones de base de datos
Las migraciones son de MikroORM y se ejecutan de forma explícita, antes de levantar la aplicación (ver [`ci-cd.md`](./ci-cd.md)):
```bash
# Producción (mismo comando que el pipeline de CD)
docker compose -f compose.prod.yml -f compose.ci.yml run --rm --no-deps api \
  sh -c "cd apps/api && node node_modules/@mikro-orm/cli/cli.js migration:up"

# Desarrollo local
cd apps/api && pnpm mikro-orm migration:up
```

### Paso 3: Inicializar la plataforma y operar
1. Iniciar los servicios.
2. Iniciar sesión como `SUPERADMIN` o crear el primer colegio vía la API de onboarding/administración.
3. Los usuarios acceden a través de su subdominio respectivo (`colegio-a.vir-ttend.app`) o seleccionan su colegio tras iniciar sesión en el portal general.

---

## 5. Configuración Paso a Paso: Modo Single-Tenant (Colegio Aislado)

Este modo se utiliza cuando un colegio exige aislamiento físico absoluto (su propia base de datos y aplicación independiente).

### Paso 1: Generar identificadores para el colegio
- **ID del Tenant:** Generar un UUID v4 (ejemplo: `e2b83490-6c92-4217-a065-98782d46e121`).
- **Slug del Tenant:** Identificador alfanumérico en minúsculas (ejemplo: `colegio-san-martin`).

### Paso 2: Configurar variables de entorno (`.env`)

En `apps/api/.env`:
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user_sanmartin:password@postgres-sanmartin.internal:5432/virttend_sanmartin
REDIS_URL=redis://redis-sanmartin.internal:6379
JWT_SECRET=clave_secreta_jwt_unica_para_sanmartin_32chars
JWT_REFRESH_SECRET=clave_secreta_refresh_unica_para_sanmartin_32chars
CORS_ORIGINS=https://sanmartin.vir-ttend.app

# Configuración Single-Tenant
TENANCY_MODE=single
TENANT_ID=e2b83490-6c92-4217-a065-98782d46e121
TENANT_SLUG=colegio-san-martin
TENANT_NAME=Colegio San Martín
ALLOW_SUPERADMIN=false

# Auto-Bootstrap del Administrador Inicial
BOOTSTRAP_ADMIN_EMAIL=admin@sanmartin.edu.ar
BOOTSTRAP_ADMIN_PASSWORD=SanMartin2026!
BOOTSTRAP_ADMIN_FIRST_NAME=Director
BOOTSTRAP_ADMIN_LAST_NAME=San Martín
```

En `apps/client/.env`:
```env
# Relativo y same-origin: el reverse proxy expone la API en /api (evita 401 por cookies SameSite)
NEXT_PUBLIC_API_URL=/api
```

### Paso 3: Ejecutar migraciones de base de datos
Mismo procedimiento que en el modo multi (migraciones de MikroORM, explícitas y previas al arranque):
```bash
docker compose -f compose.prod.yml -f compose.ci.yml run --rm --no-deps api \
  sh -c "cd apps/api && node node_modules/@mikro-orm/cli/cli.js migration:up"
```
En despliegues por CD este paso lo ejecuta el pipeline automáticamente.

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

### Paso 5: Primer arranque y Auto-Bootstrap
Al iniciar, NestJS ejecuta `TenancyBootstrapService`:
1. Verifica si el tenant `e2b83490-6c92-4217-a065-98782d46e121` existe en la base de datos dedicada. Si no existe, lo crea con estado `ACTIVE`.
2. Verifica si existen usuarios con rol `ADMIN` en dicho tenant.
3. Si no existen, crea el usuario con el email provisto, hashea la contraseña y le asigna la membresía `ADMIN`.
4. Si `BOOTSTRAP_ADMIN_PASSWORD` no fue definida, imprimirá en los logs:
   ```text
   =================================================================
   [VIR-TTEND BOOTSTRAP] Initial ADMIN credentials for colegio-san-martin:
   Email:    admin@sanmartin.edu.ar
   Password: <contraseña_generada_aleatoria>
   Note: Keep this password safe and change it after first login.
   =================================================================
   ```

### Paso 6: Marca de la instancia (opcional)

En modo `single` la instancia puede mostrar la identidad de la escuela (nombre, escudo y colores) junto con un sello fijo "con vir-ttend". La marca es un dato de la instancia, no código: vive en `deploy/branding/<slug>/`, versionada en git, y la VM la monta según `BRANDING_SLUG`. Sin marca (`BRANDING_SLUG` vacío), la instancia usa la marca Vir-ttend.

**Formato de `branding.json`** (diseño completo en la [spec de branding](superpowers/specs/2026-10-12-instance-branding-design.md)):

```json
{
  "version": 1,
  "displayName": "Colegio San Martín",
  "shortName": "San Martín",
  "colors": { "primary": "#023064", "accent": "#0195EF", "highlight": "#F9D648" },
  "assets": {
    "crest": "crest.png",
    "crestSmall": "crest-small.svg",
    "crestSmallPng": "crest-small-256.png",
    "favicon": "favicon.ico"
  }
}
```

- `version`, `displayName`, `shortName` y `colors.primary` son obligatorios; `colors.accent`, `colors.highlight` y cada entrada de `assets` son opcionales.
- Los colores son `#RRGGBB`. Si el primario no tiene contraste suficiente (4.5:1) con texto blanco o azul noche, los clientes usan la marca Vir-ttend y la API deja un aviso en el log al arrancar.
- Los assets son archivos de la misma carpeta (`png`, `webp`, `svg` o `ico`). La API calcula una versión (hash de `branding.json` y de los assets) y la agrega a las URLs (`/branding/crest.png?v=...`), así que cambiar un archivo invalida la caché.

**Agregar una escuela:**

1. Crear `deploy/branding/<slug>/` con `branding.json` y los assets.
2. Validar: `pnpm --filter api test -- branding`. Un `branding.json` con un color inválido o un asset faltante hace fallar el arranque de la API con un mensaje que nombra el campo o el archivo.
3. Commitear la carpeta. La VM hace checkout del sha exacto, así que compose monta solo la carpeta de **su** escuela.
4. Definir `BRANDING_SLUG=<slug>` en el `.env` de la VM y recrear `api` y `caddy`, que montan la carpeta: `IMAGE_TAG=latest docker compose -f compose.prod.yml -f compose.ci.yml up -d --wait api caddy`. Incluir siempre `compose.ci.yml`: sin ese override, compose intenta construir las imágenes en la VM en lugar de usar las de GHCR. Para fijar una versión, usar `IMAGE_TAG=sha-<sha completo>` en lugar de `latest`.
5. Verificar `GET /api/config/public`: `branding.source` debe ser `instance` y `branding.colors.primary` el de la escuela. Los assets se sirven desde `https://<dominio>/branding/<archivo>`.

**Cómo se sirven los assets:** en producción, Caddy atiende `/branding/*` desde la carpeta montada (`/srv/branding`). En desarrollo, sin Caddy, la API sirve `BRANDING_DIR` en `/branding` (solo si `NODE_ENV` no es `production`).

> [!NOTE]
> En modo `multi` la marca se ignora: la API responde siempre la marca Vir-ttend (`branding.source = "virttend"`) y no lee el disco, aunque `BRANDING_DIR` exista. Si una instancia `single` no tiene `branding.json`, arranca con la marca Vir-ttend y deja un aviso en el log.

---

## 6. Verificación y Validación Post-Despliegue

### 6.1 Verificar Configuración Pública
La instancia sirve web y API desde un único dominio: Caddy envía `/api/*` a la API (sin prefijo de versión). Ejecutar un `GET` a `/api/config/public`:
```bash
curl -X GET https://sanmartin.vir-ttend.app/api/config/public
```

Respuesta esperada en modo single (todas las respuestas de la API vienen envueltas en `{ success, data, timeStamp }`):
```json
{
  "success": true,
  "data": {
    "tenancyMode": "single",
    "tenantId": "e2b83490-6c92-4217-a065-98782d46e121",
    "tenantSlug": "colegio-san-martin",
    "tenantName": "Colegio San Martín",
    "allowSuperadmin": false,
    "branding": {
      "source": "instance",
      "version": "f0d5abcfae",
      "displayName": "Colegio San Martín",
      "shortName": "San Martín",
      "colors": { "primary": "#023064", "accent": "#0195EF", "highlight": "#F9D648" },
      "assets": {
        "crest": "/branding/crest.png?v=f0d5abcfae",
        "crestSmall": "/branding/crest-small.svg?v=f0d5abcfae",
        "crestSmallPng": "/branding/crest-small-256.png?v=f0d5abcfae",
        "favicon": "/branding/favicon.ico?v=f0d5abcfae"
      },
      "showPoweredBy": true
    }
  },
  "timeStamp": "2026-10-12T12:00:00.000Z"
}
```

Este endpoint es público y no expone secretos: lo consumen la web y la app móvil para conocer el modo del despliegue.

### 6.2 Probar Inicio de Sesión
Hacer un `POST` a `/auth/login` con las credenciales creadas:
```bash
curl -X POST https://sanmartin.vir-ttend.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sanmartin.edu.ar","password":"SanMartin2026!"}'
```

En modo `single`, la respuesta retornará directamente las cookies de sesión (`access_token` y `refresh_token`), el `tenant` resuelto y los datos del usuario, sin requerir el paso `/auth/select-tenant`.

### 6.3 Comprobar Bloqueos de Seguridad
1. **Intento de inicio de sesión con credenciales de otro colegio:**
   - La API responde `401 Unauthorized` ("Invalid credentials"). No revela si el usuario existe en otra base de datos.
2. **Acceso con token JWT emitido para otro `tenantId`:**
   - Si un usuario presenta un token con un `tenantId` distinto al configurado en la instancia, `TenantMiddleware` responde `403 Forbidden`.
3. **Acceso de Superadmin:**
   - Si `ALLOW_SUPERADMIN=false`, cualquier intento de login o acceso con rol `SUPERADMIN` es rechazado con `403 Forbidden`.

---

## 7. Aplicación Móvil (Expo)

La app móvil (`apps/mobile`) se compila desde el mismo código para cada servidor. El **modo de tenancy nunca lo decide el usuario ni la app**: lo define el despliegue (`TENANCY_MODE` en el `.env` de la instancia) y la app lo lee del servidor.

### 7.1 Qué se define al compilar y qué viene del servidor

| Dato | Origen | Dónde se configura |
|---|---|---|
| Nombre, ícono e identificador de la app | Al compilar (variante) | `apps/mobile/app.config.ts` (`VARIANTS`) |
| URL de la API | Al compilar (variante o perfil EAS) | `extra.apiUrl` de la variante o `EXPO_PUBLIC_API_URL` en `apps/mobile/eas.json` |
| Modo `single` / `multi`, `tenantId`, nombre del colegio | Servidor, en tiempo de ejecución | `GET /config/public` (variables `TENANCY_MODE`, `TENANT_ID`, `TENANT_NAME` de la API) |

La URL de la API se resuelve con esta prioridad:
1. `EXPO_PUBLIC_API_URL` (perfil de EAS o `.env.local` en desarrollo).
2. `extra.apiUrl` de la variante.
3. `http://localhost:3001` (solo desarrollo).

> [!IMPORTANT]
> Los builds de `preview` y `production` **fallan al compilar** si la variante no tiene URL de API (ni `extra.apiUrl` ni `EXPO_PUBLIC_API_URL`). Así se evita publicar una app que apunte a `localhost`. En producción la URL debe ser `https`: Android bloquea `http` en builds de release.

### 7.2 Comportamiento según el modo del servidor

Al iniciar (y antes del login) la app consulta `GET /config/public` y guarda la respuesta en el dispositivo, asociada a la URL del servidor, para poder funcionar sin conexión. Esa copia no se borra al cerrar sesión.

| Modo del servidor | Comportamiento en la app |
|---|---|
| `single` | Tras el login entra directamente al colegio `tenantId`. Si el usuario no tiene rol de preceptor o docente en ese colegio, se muestra "Acceso restringido". |
| `multi` | Si el usuario pertenece a un solo colegio, entra directo; si pertenece a varios, elige el colegio tras el login. |
| Sin configuración (primer arranque sin red) | Se aplica la regla por membresías del modo `multi`. El servidor igualmente impone su modo real en el login. |

La pantalla de **Ajustes** es solo informativa: muestra colegio, servidor, modo ("Configurado por el servidor") y versión.

### 7.3 Variantes actuales

| Variante (`APP_VARIANT`) | Nombre | Identificador | Servidor | Modo esperado |
|---|---|---|---|---|
| `general` | Vir-ttend | `com.virttend.app` | Servidor compartido multi-tenant (**dominio pendiente**) | `multi` |
| `eest3` | EEST Nº3 Eva Perón | `com.virttend.eest3` | `https://eest3.virttend.app/api` | `single` |

Ambas variantes pertenecen al mismo proyecto de EAS (mismo `slug`) y pueden instalarse a la vez en un dispositivo porque sus identificadores son distintos.

### 7.4 Agregar un colegio con servidor propio

1. **Desplegar la instancia** siguiendo la [sección 5](#5-configuración-paso-a-paso-modo-single-tenant-colegio-aislado), con `TENANCY_MODE=single`, `TENANT_ID`, `TENANT_SLUG` y `TENANT_NAME`.
2. **Verificar** que `https://<dominio>/api/config/public` responda con `tenancyMode: "single"`.
3. **Agregar la variante** en `apps/mobile/app.config.ts` (`VARIANTS`): nombre corto, `scheme`, `appId` (ej. `com.virttend.<slug>`), ícono y `apiUrl: 'https://<dominio>/api'`.
4. **Agregar los perfiles** `preview-<slug>` y `production-<slug>` en `apps/mobile/eas.json` con `APP_VARIANT=<slug>` y `EXPO_PUBLIC_API_URL`.
5. **Agregar los recursos gráficos** del colegio (ícono, splash) si los provee.
6. **Compilar** con EAS (ver 7.5).

No hace falta modificar la lógica de la app: el modo y el colegio se leen del servidor.

### 7.5 Compilar con EAS

Requisito previo (una sola vez): `npx eas-cli@latest init` dentro de `apps/mobile` para crear el proyecto de EAS y registrar su `projectId` en `app.config.ts`.

```bash
cd apps/mobile

# APK de prueba (distribución interna)
npx eas-cli@latest build --profile preview-eest3 --platform android

# Build de tienda
npx eas-cli@latest build --profile production-eest3 --platform android
```

Los perfiles `*-general` no compilarán hasta definir la URL del servidor compartido.

### 7.6 Desarrollo local

- La app corre en Expo Go sobre un dispositivo Android conectado por USB: `pnpm --filter mobile android:usb` crea los túneles `adb reverse` (3001 para la API, 8081 para Metro) e inicia Expo.
- Si se desconecta el cable o se reinicia `adb`, los túneles se pierden: `pnpm --filter mobile android:reverse` los restaura.
- Para probar una variante: `APP_VARIANT=eest3 npx expo start` (dentro de `apps/mobile`). Si `.env.local` define `EXPO_PUBLIC_API_URL`, esa URL tiene prioridad sobre la de la variante.
- Las variables `EXPO_PUBLIC_TENANCY_MODE`, `EXPO_PUBLIC_APP_NAME` y `EXPO_PUBLIC_DEFAULT_TENANT_*` ya no se usan y pueden eliminarse.
- El contenedor de la API debe reconstruirse tras cambios de backend (`docker compose up -d --build api`); de lo contrario la app consume una versión anterior de la API.

---

## 8. Resolución de Problemas (Troubleshooting)

### Error: `JWT_SECRET and JWT_REFRESH_SECRET must not be identical`
- **Causa:** En modo producción, se configuró el mismo valor para el token de acceso y de refresco.
- **Solución:** Asignar cadenas aleatorias distintas para cada una en el archivo `.env`.

### Error: `Insecure default JWT secrets cannot be used in production environment`
- **Causa:** Se utilizó una cadena por defecto o de prueba (como `secret`, `123456`, o similar) en `NODE_ENV=production`.
- **Solución:** Generar claves criptográficas seguras (por ejemplo, con `openssl rand -hex 32`).

### Error: `403 Forbidden` al acceder a endpoints protegidos
- **Causa común 1:** El usuario existe pero no tiene membresía activa en el tenant configurado (`TENANT_ID`).
- **Causa común 2:** La variable `ALLOW_SUPERADMIN` está en `false` y se intenta acceder con una cuenta global de soporte.
- **Solución:** Utilizar una cuenta perteneciente al colegio o activar temporalmente `ALLOW_SUPERADMIN=true` únicamente para tareas de mantenimiento autorizadas.

### Olvido de contraseña del Administrador inicial
- En modo single, si se necesita reiniciar el acceso del administrador inicial y la base de datos ya contiene registros, un operador de base de datos puede actualizar el hash o invocar el comando correspondiente vía CLI institucional.

### App móvil: "No se puede conectar con el servidor"
- **Causa común 1 (desarrollo):** se perdió el túnel `adb reverse tcp:3001 tcp:3001`. Verificar con `adb reverse --list` y restaurar con `pnpm --filter mobile android:reverse`.
- **Causa común 2:** la API no está levantada o la URL de la variante es incorrecta. Verificar `https://<dominio>/api/health`.
- La app reintenta automáticamente y sincroniza los cambios pendientes cuando el servidor vuelve a responder.

### App móvil: error de build `has no API URL`
- **Causa:** se compiló un perfil `preview` o `production` cuya variante no tiene URL de API.
- **Solución:** definir `apiUrl` en la variante (`app.config.ts`) o `EXPO_PUBLIC_API_URL` en el perfil de `eas.json`.

### App móvil: entra en un modo o colegio inesperado
- **Causa:** el modo lo define el servidor, no la app.
- **Solución:** revisar `TENANCY_MODE`, `TENANT_ID` y `TENANT_NAME` en el `.env` de la instancia y confirmar la respuesta de `GET /config/public`. La app actualiza su copia guardada la próxima vez que tiene conexión.
