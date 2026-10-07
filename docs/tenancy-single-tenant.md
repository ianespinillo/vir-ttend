# Plan: instancias privadas por escuela (single-tenant) en Vir-ttend

> Documento para un agente de código. Leer `AI_CONTEXT.md` y `docs/tenancy-single-tenant.md` antes de empezar.

## 1. Objetivo

Poder desplegar **una instancia aislada por escuela** (app + base de datos + Redis + secretos propios) usando **el mismo repositorio y el mismo código**, y seguir ofreciendo en paralelo la instancia compartida multi-tenant.

| Modo | `TENANCY_MODE` | Uso |
|---|---|---|
| Compartido | `multi` (default) | Varias escuelas en una instancia, aisladas por `tenantId` |
| Privado | `single` | Una instancia = una escuela, con `TENANT_ID` fijo por entorno |

## 2. Stack real (no asumir otro)

- Backend: NestJS 10 + MikroORM 6 + PostgreSQL 16 + Redis 7. Arquitectura hexagonal / DDD / CQRS.
- Frontend: Next.js 16 (App Router) en `apps/client`. Hooks en `@repo/hooks`, tipos y schemas en `@repo/common`.
- La resolución de tenant actual **sale del JWT** (`TenantMiddleware` -> `TenantContextService` con `AsyncLocalStorage`, en `apps/api/src/common/tenant/`), no del hostname.
- Login en dos pasos: `POST /auth/login` (devuelve tenants) y `POST /auth/select-tenant` (emite JWT con rol del membership).
- El aislamiento hoy es por **filtro `tenantId` en repositorios**. **No existe RLS nativo de PostgreSQL**; no asumirlo ni documentarlo como existente.

## 3. Reglas que no se pueden romper

1. No forkear ni duplicar código en carpetas `single-tenant/`. Un solo path, dos comportamientos por configuración.
2. No eliminar `tenantId` de entidades, FKs, índices ni queries. En modo `single` sigue usándose, siempre con el mismo valor.
3. Cambios de esquema solo con migración MikroORM versionada. Prohibido `schema:update`.
4. Respetar capas: dominio sin dependencias de NestJS/MikroORM; lógica en `application`; acceso a datos en `infrastructure`.
5. No introducir queries ad-hoc en el frontend; usar `@repo/hooks`.
6. El modo `multi` debe comportarse exactamente igual que antes de estos cambios.

## 4. Fase 0: auditoría (Completada)

Resultados de la auditoría inicial sobre el código real:

- [x] ¿Dónde se lee `TENANCY_MODE`, `TENANT_ID`, `TENANT_SLUG` y qué hace cada uno hoy? *(Implementado en `apps/api/src/modules/shared/config/tenancy.config.ts`)*.
- [x] ¿La API falla al arrancar si `TENANCY_MODE=single` y falta `TENANT_ID`? *(Implementado con validación fail-fast en arranque)*.
- [x] ¿Existe bootstrap automático (tenant, school, ciclo lectivo, primer admin)? ¿Es idempotente? *(Implementado en `TenancyBootstrapService`, 100% idempotente)*.
- [x] ¿Qué hace el login en modo `single` (se muestra `select-tenant` o no)? *(En single-tenant emite cookies directamente y el frontend no muestra selector)*.
- [x] ¿Un JWT con `tenantId` distinto de `TENANT_ID` es rechazado en modo `single`? *(Rechazado con 403 Forbidden en `TenantMiddleware` y `TenantGuard`)*.
- [x] ¿El prefijo de claves de Redis incluye `tenantId` o un prefijo de instancia? *(Configurado `keyPrefix` con `TENANT_SLUG` / `INSTANCE_ID` en `CacheModule`)*.
- [x] ¿Las cookies se emiten sin atributo `Domain`? *(Verificado: se emiten sin atributo `Domain`, con `httpOnly`, `sameSite: strict` y `secure: isProd`)*.
- [x] ¿`/tenants` y referencias multi-tenant siguen visibles en la UI en modo `single`? *(Ocultadas vía `usePublicConfig`, `getNavConfig` y `isPathAllowedForRole`)*.
- [x] ¿Qué pasa con la cuenta `SUPERADMIN` en modo `single`? *(Controlado por `ALLOW_SUPERADMIN`, por defecto `false` en modo single)*.
- [x] ¿Hay tests que corran en ambos modos? *(Suite completa implementada en `apps/api/test/unit/identity/tenancy-single-tenant.spec.ts`)*.

## 5. Fase 1: comportamiento del modo `single`

### 5.1 Validación de arranque (fail fast)
- Si `TENANCY_MODE=single`: exigir `TENANT_ID` y `TENANT_SLUG`; si faltan, abortar con mensaje claro.
- Si `NODE_ENV=production`: rechazar arranque si `JWT_SECRET` o `JWT_REFRESH_SECRET` están vacíos, son iguales entre sí o coinciden con los valores de ejemplo.
- Validar `DATABASE_URL`, `REDIS_URL` y `CORS_ORIGINS`.

### 5.2 Resolución de tenant
- Mantener `TenantMiddleware` / `TenantContextService`. En modo `single`, el tenant efectivo es `TENANT_ID`.
- Si hay JWT y su `tenantId` no coincide con `TENANT_ID` (y el usuario no es superadmin habilitado), responder 403.
- No introducir una abstracción nueva si el middleware actual alcanza; solo la que haga falta para soportar ambos modos sin duplicar lógica.

### 5.3 Bootstrap idempotente
Al arrancar en modo `single` (antes de aceptar tráfico, después de las migraciones):
- Upsert del `Tenant` con `TENANT_ID`, `TENANT_SLUG`, `TENANT_NAME`.
- Crear la `School` inicial si no existe, a partir de variables opcionales (`SCHOOL_NAME`, `SCHOOL_LEVELS`).
- Crear el primer usuario `ADMIN` con su `UserTenantMembership` solo si el tenant no tiene ningún admin. Datos desde `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_FIRST_NAME`, `BOOTSTRAP_ADMIN_LAST_NAME`.
- Contraseña: `BOOTSTRAP_ADMIN_PASSWORD` si está definida; si no, generarla y mostrarla **una sola vez** por stdout. `mustChangePassword = true`.
- Reutilizar los handlers/servicios de dominio existentes (por ejemplo `CreateUserHandler`) en vez de insertar directo en la base.
- Reejecutarlo no debe duplicar ni modificar datos existentes.

### 5.4 Login sin selector de tenant
- Modo `single`: el login valida credenciales y, si el usuario tiene membership activo en `TENANT_ID`, emite la sesión directamente (o el frontend salta `select-tenant` automáticamente). Sin membership: 401 con el mismo mensaje genérico.
- Modo `multi`: flujo de dos pasos sin cambios.
- Exponer un endpoint público de configuración (por ejemplo `GET /config/public`) con `{ tenancyMode, tenantName }` para que el frontend adapte la UI.

### 5.5 Superadmin
- Variable `ALLOW_SUPERADMIN` (default `true` en `multi`, `false` en `single`).
- Con `false`, el login de superadmin se rechaza en esa instancia. Debe poder activarse temporalmente para soporte.

### 5.6 Frontend
- En modo `single`: ocultar `/tenants`, el selector de tenant y cualquier texto multi-tenant. Mostrar el nombre de la escuela.
- `isPathAllowedForRole` y el sidebar deben respetar el modo.

## 6. Fase 2: aislamiento real entre instancias

- Secretos JWT distintos por instancia (validado en 5.1).
- Cookies **sin** atributo `Domain`, con `httpOnly`, `secure`, `sameSite=strict` (para que no se compartan entre subdominios).
- `CORS_ORIGINS` limitado al dominio de esa escuela.
- Redis: prefijo de claves con `TENANT_SLUG` o un `INSTANCE_ID`, para el caso de compartir un Redis por error.
- Auditar que ninguna query SQL cruda (por ejemplo `ReportDataService`) omita el filtro `tenantId`.

## 7. Fase 3: despliegue repetible

- `compose.prod.yml`: postgres, redis, api, client y un proxy (Caddy) con TLS automático.
- Entrypoint de la API: `migration:up` antes de iniciar, luego bootstrap (5.3).
- `.env.production.example` por instancia con todas las variables comentadas y marcando cuáles deben ser únicas.
- Script de backup (`pg_dump` diario con rotación y copia externa) y script de actualización con backup previo y rollback a la imagen anterior.
- Documentar el alta de una escuela nueva en pasos numerados.

## 8. Tests

- Unit: validación de arranque, bootstrap idempotente (ejecutar dos veces), rechazo de JWT con tenant ajeno en `single`, login directo en `single`, `ALLOW_SUPERADMIN=false`.
- Correr la suite relevante con `TENANCY_MODE=multi` y con `TENANCY_MODE=single`.
- Test de regresión de `multi`: el flujo de dos pasos y el aislamiento entre tenants siguen igual.

## 9. Fuera de alcance

- Fork del repositorio.
- Schema por escuela.
- Eliminar `tenantId` o cambiar el modelo de datos.
- Row Level Security nativo (queda como deuda técnica v2; si se implementa, es otra tarea).
- Fallback de caché en memoria sin Redis (opcional, tarea aparte).

## 10. Criterios de aceptación
 
- [x] `multi` se comporta igual que antes (tests de regresión verdes: 46 suites / 249 tests pasando).
- [x] `single` sin `TENANT_ID` o con secretos inválidos en producción no arranca y explica por qué.
- [x] Levantar una instancia `single` con base vacía deja lista la escuela, la school y el primer admin, y reiniciar no duplica nada.
- [x] En `single`, el login no pasa por el selector de tenant y `/tenants` no aparece en la UI.
- [x] Un token emitido por una instancia no es válido en otra (secretos distintos).
- [x] Las cookies no tienen `Domain`.
- [x] `ALLOW_SUPERADMIN=false` bloquea el acceso del superadmin en esa instancia.
- [x] Documentación actualizada: README con sección "Modalidades de despliegue" y `.env.example` con las variables nuevas.

## 11. Variables de entorno (nuevas o a confirmar)

| Variable | Modo | Descripción |
|---|---|---|
| `TENANCY_MODE` | ambos | `multi` (default) o `single` |
| `TENANT_ID` | single | ID fijo del tenant |
| `TENANT_SLUG` | single | Slug único |
| `TENANT_NAME` | single | Nombre legible |
| `SCHOOL_NAME`, `SCHOOL_LEVELS` | single | Datos de la school inicial |
| `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_FIRST_NAME`, `BOOTSTRAP_ADMIN_LAST_NAME` | single | Primer admin |
| `BOOTSTRAP_ADMIN_PASSWORD` | single (opcional) | Si falta, se genera y se muestra una vez |
| `ALLOW_SUPERADMIN` | ambos | Habilita login de superadmin |
| `INSTANCE_ID` | opcional | Prefijo de claves de caché |
