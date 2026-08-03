# Vir-ttend API

Backend REST de **Vir-ttend**, un sistema multi-tenant de gestión de asistencia escolar para primaria y secundaria.

## Stack

- [NestJS](https://nestjs.com/) 10 + TypeScript
- [MikroORM](https://mikro-orm.io/) 6 con PostgreSQL (migraciones SQL versionadas)
- [Redis](https://redis.io/) vía `ioredis` para caché de reportes y dashboards
- Autenticación JWT (access + refresh) con cookies httpOnly
- `class-validator` / `class-transformer` con `ValidationPipe` global (whitelist estricta)
- Exportación de reportes a Excel (`exceljs`) y PDF (`pdfkit`)
- Tests unitarios con Jest + `jest-mock-extended`

Vive en un monorepo pnpm (workspaces). Depende en runtime de `@repo/common` (paquete compilado con tsup a CJS/ESM).

## Requisitos

- Node.js 20+
- pnpm 9.8.0 (o `corepack enable`)
- PostgreSQL 15+ y Redis 7+ (locales o vía Docker)

## Setup local

```bash
# 1. Instalar dependencias (desde la raíz del monorepo)
pnpm install

# 2. Compilar el paquete compartido (la API lo importa en runtime)
pnpm --filter @repo/common build

# 3. Configurar variables de entorno
cd apps/api
cp .env.example .env
# editar .env con credenciales de PostgreSQL/Redis y secrets de JWT

# 4. Levantar la API en watch mode
cd ../..
pnpm --filter api dev
```

La API arranca en `http://localhost:3000` (configurable con `PORT`).

### Swagger / OpenAPI

La API expone documentación interactiva generada con `@nestjs/swagger` (controllers, DTOs, autenticación por cookie y ejemplos en español):

| Ruta | Descripción |
|---|---|
| `GET /docs` | UI interactiva (Swagger UI) |
| `GET /docs-json` | Especificación OpenAPI en JSON |

Los endpoints protegidos usan la cookie httpOnly `access_token`; el botón *Authorize* de Swagger UI envía el valor en el request (en desarrollo, el header cookie se puede simular manualmente).

### Base de datos y migraciones

```bash
# Crear una migración nueva (desde apps/api)
pnpm mikro-orm migration:create -- --name=<nombre>

# Aplicar migraciones pendientes
pnpm mikro-orm migration:up

# Revertir la última migración
pnpm mikro-orm migration:down
```

## Variables de entorno

| Variable | Requerida | Default | Descripción |
|---|---|---|---|
| `PORT` | no | `3000` | Puerto HTTP del servidor |
| `NODE_ENV` | no | `development` | `development` \| `production` \| `test` |
| `DATABASE_URL` | sí | — | URL de conexión PostgreSQL, ej. `postgresql://postgres:postgres@localhost:5432/virttend` |
| `REDIS_URL` | sí | `redis://localhost:6379` | URL de conexión Redis |
| `JWT_SECRET` | sí | — | Secreto para firmar access tokens |
| `JWT_REFRESH_SECRET` | sí | — | Secreto para firmar refresh tokens |

## Scripts

| Comando | Descripción |
|---|---|
| `pnpm --filter api dev` | Desarrollo con hot-reload (`nest start --watch`) |
| `pnpm --filter api build` | Compilar a `dist/` (`nest build`) |
| `pnpm --filter api start:prod` | Ejecutar el build (`node dist/main`) |
| `pnpm --filter api test` | Tests unitarios (Jest) |
| `pnpm --filter api test:cov` | Tests con cobertura |
| `pnpm --filter api test:e2e` | Tests e2e |
| `pnpm --filter api lint` | ESLint con autofix |

## Docker

```bash
# Build de la imagen (context = raíz del monorepo)
docker build -f dockerfile -t virttend-api .

# Ejecutar con las variables de entorno
docker run --rm -p 3000:3000 \
  -e DATABASE_URL=postgresql://postgres:postgres@localhost:5432/virttend \
  -e REDIS_URL=redis://localhost:6379 \
  -e JWT_SECRET=change_me \
  -e JWT_REFRESH_SECRET=change_me_refresh \
  virttend-api
```

El `Dockerfile.api` es multi-stage: compila `@repo/common` y la API en un stage `builder` y copia solo `node_modules`, `packages/common` y `apps/api/dist` al stage `runner` (imagen `node:20-alpine`, usuario `node`, expone el puerto `3000`). Ejecuta las migraciones antes de arrancar (`pnpm mikro-orm migration:up`).

## Arquitectura

Cada módulo de negocio sigue Clean Architecture (domain → application → infrastructure → presentation):

```
src/
├── main.ts                          # bootstrap: pipes, filters, interceptors
├── app.module.ts                    # módulo raíz (Config, MikroORM, Redis, eventos)
├── common/                          # guards, decorators, pipes, interceptors, filtros
└── modules/
    ├── identity/                    # auth JWT, usuarios, tenants, comunicados
    ├── academic/                    # años académicos, cursos, materias, horarios, estudiantes
    ├── attendance/                  # asistencia diaria/por materia, alertas, dashboard
    ├── reporting/                   # reportes mensuales, resúmenes, exportación Excel/PDF
    ├── health/                      # health checks de la API, DB y Redis
    ├── events/                      # eventos de dominio
    └── shared/                      # database (mikro-orm + migraciones), cache (Redis), config
```

## Endpoints principales

Auth y rol (`SUPERADMIN` | `ADMIN` | `PRECEPTOR` | `TEACHER`) se manejan con guards JWT y de roles; la autenticación usa cookies httpOnly.

### Health

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Estado general (`ok`, `timestamp`, `version`) |
| `GET` | `/health/db` | Verifica la conexión a PostgreSQL |
| `GET` | `/health/redis` | Verifica la conexión a Redis (`PING`/`PONG`) |

### Auth e Identity

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/auth/login` | Login → lista de tenants del usuario |
| `POST` | `/auth/select-tenant` | Selecciona tenant y emite cookies JWT |
| `POST` | `/auth/refresh` | Renueva el access token |
| `POST` | `/auth/logout` | Invalida la sesión |
| `GET` | `/users/me` | Usuario autenticado |
| `GET` | `/users` | Usuarios del tenant |
| `PUT` | `/users/:id/role` | Cambiar rol |
| `POST` | `/tenants` | Crear tenant |
| `GET` | `/tenants` | Listar tenants |
| `PUT` | `/tenants/:id` | Actualizar tenant |
| `PATCH` | `/tenants/:id/status` | Activar/suspender tenant |

### Comunicados

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/announcements?schoolId=&status=` | Listar comunicados (paginado) |
| `GET` | `/announcements/for-me` | Comunicados dirigidos al usuario autenticado |
| `POST` | `/announcements` | Crear comunicado (draft o publicado) |
| `GET` | `/announcements/:id` | Obtener comunicado |
| `PUT` | `/announcements/:id` | Actualizar borrador (solo autor/admin) |
| `PATCH` | `/announcements/:id/publish` | Publicar borrador (solo autor/admin) |
| `DELETE` | `/announcements/:id` | Eliminar (solo admin) |

### Académico

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/academic-years` | Años académicos |
| `GET` | `/courses` | Cursos |
| `GET` | `/courses/:id` | Detalle de curso |
| `POST` | `/students` | Crear estudiante |
| `GET` | `/students` | Listar estudiantes (paginado) |
| `GET` | `/students/search` | Búsqueda de estudiantes |
| `POST` | `/students/:id/enroll` | Matricular estudiante |
| `POST` | `/students/:id/transfer` | Transferir de curso |
| `GET` | `/subjects` | Materias |
| `GET` | `/schedule` | Horarios |

### Asistencia y alertas

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/attendance/daily` | Registrar asistencia diaria (primaria) |
| `POST` | `/attendance/subject` | Registrar asistencia por materia (secundaria) |
| `POST` | `/attendance/subject/all` | Carga masiva de asistencia por materia |
| `GET` | `/attendance/daily` | Asistencia diaria por curso/fecha |
| `GET` | `/attendance/student/:studentId` | Historial de un estudiante |
| `GET` | `/attendance/history` | Historial de asistencia |
| `GET` | `/attendance/subject/:subjectId/history` | Historial por materia |
| `POST` | `/attendance/:id/justify` | Justificar inasistencia |
| `GET` | `/alerts` | Alertas de ausencias |
| `GET` | `/alerts/unseen` | Alertas no vistas |
| `GET` | `/alerts/count` | Contador de alertas no vistas |
| `GET` | `/alerts/student/:studentId` | Alertas de un estudiante |
| `PATCH` | `/alerts/:id/seen` | Marcar alerta como vista |
| `GET` | `/dashboard` | Resumen del panel |
| `GET` | `/dashboard/course/:courseId` | Dashboard de un curso |

### Reportes y exportación

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/reports/monthly?courseId=&month=&year=` | Reporte mensual de un curso |
| `POST` | `/reports/generate` | Generar reporte mensual |
| `GET` | `/reports/course/:courseId/summary` | Resumen del curso |
| `GET` | `/reports/course/:courseId/available` | Reportes disponibles del curso |
| `GET` | `/reports/student/:studentId` | Reporte detallado de un estudiante |
| `POST` | `/reports/export/excel` | Exportar a Excel |
| `POST` | `/reports/export/pdf` | Exportar a PDF |

## Testing

```bash
pnpm --filter api test
```

La suite son 40 archivos de spec con 202 tests unitarios (handlers de commands/queries, servicios de dominio, controllers, health checks).

## Health checks

```
GET /health     → { status: "ok", timestamp, version }
GET /health/db  → 200 si PostgreSQL responde, 503 si falla
GET /health/redis → 200 si Redis responde PONG, 503 si falla
```
