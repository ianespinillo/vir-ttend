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
Ambos modos ejecutan exactamente las mismas migraciones de base de datos, los mismos esquemas de Prisma y la misma lógica de dominio. Ninguna columna ni clave foránea (`tenantId`) se elimina o altera; la diferencia radica exclusivamente en cómo se resuelve y restringe el contexto del tenant en tiempo de ejecución.

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
| `TENANT_NAME` | No | Opcional | Nombre institucional legible para reportes y logs. |
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
```bash
pnpm --filter api prisma migrate deploy
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
```bash
pnpm --filter api prisma migrate deploy
```

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

---

## 6. Verificación y Validación Post-Despliegue

### 6.1 Verificar Configuración Pública
Ejecutar un `GET` a `/config/public`:
```bash
curl -X GET https://api-sanmartin.vir-ttend.app/api/v1/config/public
```

Respuesta esperada en modo single:
```json
{
  "tenancyMode": "single",
  "tenantId": "e2b83490-6c92-4217-a065-98782d46e121",
  "tenantSlug": "colegio-san-martin",
  "tenantName": "Colegio San Martín"
}
```

### 6.2 Probar Inicio de Sesión
Hacer un `POST` a `/auth/login` con las credenciales creadas:
```bash
curl -X POST https://api-sanmartin.vir-ttend.app/api/v1/auth/login \
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

## 7. Resolución de Problemas (Troubleshooting)

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
