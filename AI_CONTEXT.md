# AI Context — Vir-ttend Monorepo

> **Documento de contexto operativo para Modelos de Lenguaje (LLMs) y agentes autónomos de codificación.**
> Contiene el mapa mental, decisiones arquitectónicas, estado actual de implementación, invariantes de diseño y convenciones clave de **Vir-ttend**.

---

## 1. Identidad y Misión del Proyecto

- **Nombre:** Vir-ttend
- **Tipo de Producto:** SaaS escolar multi-tenant para control de asistencia, alertas tempranas y comunicación institucional.
- **Niveles Educativos Cubiertos:**
  - **Primaria:** Asistencia diaria por curso y jornada.
  - **Secundaria:** Asistencia granular por materia y bloque horario.
- **Estrategia de Tenancy:** Base de código única multi-tenant-ready con soporte de **despliegues aislados single-tenant** por variables de entorno sin forkear el repositorio.

---

## 2. Mapa del Monorepo y Responsabilidades

El repositorio utiliza **pnpm 9 workspaces** coordinado con **Turborepo**:

```
vir-ttend/
├── apps/
│   ├── api/                 # Backend REST modular (NestJS 10, MikroORM 6, PostgreSQL, Redis)
│   ├── client/              # Frontend web de producción (Next.js 16 App Router, React 19, Tailwind)
│   ├── demo/                # App de demostración comercial interactiva (desconectada, estado en localStorage)
│   ├── mobile/              # App móvil nativa (Expo SDK 57, NativeWind) para preceptores y docentes
│   └── site/                # Landing pública estática (Next.js, Vercel) con páginas de descarga
├── packages/
│   ├── branding/            # Lógica de branding agnóstica de framework (Zod schemas, tokens, assets)
│   ├── common/              # DTOs, schemas Zod, interfaces de dominio, enums de roles y utilidades
│   ├── hooks/               # Custom hooks de React con TanStack Query y cliente HTTP Axios
│   ├── ui/                  # Design System (Radix UI, Tailwind CSS, layouts y componentes de presentación)
│   ├── typescript-config/   # tsconfig base compartidos
│   └── eslint-config/       # Reglas y configuraciones base de ESLint
├── docs/                    # Documentación viva: arquitectura (C4), despliegue, CI/CD y demos
├── compose.yml              # Orquestación Docker de PostgreSQL (16), Redis (7), API y Cliente
└── AI_CONTEXT.md            # Este archivo de contexto
```

---

## 3. Estado Actual de Cada Aplicación y Paquete

### 3.1 `apps/api` (Backend)
- **Framework:** NestJS 10 con TypeScript estricto.
- **Patrón:** Clean Architecture / Hexagonal y principios de Domain-Driven Design (DDD).
- **Persistencia:** PostgreSQL 16 con **MikroORM 6** y migraciones SQL versionadas (`apps/api/src/modules/shared/database/migrations/`).
- **Caché:** Redis 7 (`ioredis`) para métricas de panel, sesiones y reportes.
- **Autenticación:** JWT con access token de corta duración y refresh token persistido. Las cookies se configuran como `httpOnly`.
- **Documentación de API:** Swagger / OpenAPI disponible en runtime en `GET /docs` y especificación JSON en `GET /docs-json`.
- **Bounded Contexts implementados:**
  - `identity`: Usuarios, tenants (instituciones), membresías, roles, autenticación y comunicados (`announcements`).
  - `academic`: Ciclos lectivos (`academic-years`), cursos, materias, asignaciones horarias (`schedule`) y estudiantes.
  - `attendance`: Registro diario, registro por materia, justificaciones, cálculo de porcentajes y alertas automáticas por umbrales de inasistencia.
  - `reporting`: Generación de consolidados mensuales y exportación binaria a Excel (`exceljs`) y PDF (`pdfkit`).
  - `health`: Endpoints de liveness/readiness para API (`/health`), PostgreSQL (`/health/db`) y Redis (`/health/redis`).

### 3.2 `apps/client` (Frontend de Producción)
- **Framework:** Next.js 16 (App Router) + React 19 + Tailwind CSS.
- **Control Perimetral:** `src/middleware.ts` intercepta peticiones validando cookies de sesión (`access_token`, `jwt`, `session`).
- **Rutas Públicas:** `(auth)/login` y `(auth)/select-tenant`.
- **Rutas Protegidas:** `(dashboard)/*` envueltas en `DashboardLayout` de `@repo/ui`:
  - `/dashboard`: Panel adaptativo según rol con métricas y accesos rápidos.
  - `/students`: Nómina, matriculación, edición y legajo de alumnos.
  - `/courses`: Cursos y divisiones académicas.
  - `/attendance/daily`: Toma y edición de asistencia diaria (Primaria).
  - `/attendance/subject`: Asistencia por materia y módulo horario (Secundaria).
  - `/alerts`: Gestión de alertas de inasistencias acumuladas.
  - `/announcements`: Publicación y lectura de circulares escolares.
  - `/reports`: Generación y descarga de informes mensuales.
  - `/users`: Administración de usuarios y membresías escolares.
  - `/tenants`: Panel de control de instituciones (exclusivo Superadmin).
  - `/settings` y `/me`: Configuraciones institucionales y perfil personal.

### 3.3 `apps/demo` (Frontend Comercial Desconectado)
- **Propósito:** Demostraciones de ventas en vivo con directivos sin requerir base de datos ni conexión a internet.
- **Persistencia:** Store reactivo en memoria con persistencia en `localStorage` bajo clave versionada (`virttend-demo-state:v1`).
- **Funcionalidades Demo:**
  - Selector de perfiles sembrados ("Entrar como Superadmin, Directora, Preceptor, Docente").
  - Botón flotante "Role Switcher" para alternar roles en caliente.
  - Botón "Reset demo" para restaurar el estado canónico al instante.
  - Simulación completa de todas las pantallas y flujos visuales del MVP.

### 3.4 `apps/mobile` (App Móvil Nativa)
- **Tecnología:** Expo SDK 57 + React Native, NativeWind.
- **Destinatarios:** Preceptores y docentes.
- **Variantes:** Un único codebase, dos variantes controladas por la variable de entorno `APP_VARIANT`:
  - `general` → `com.virttend.app` / Vir-ttend (servidor compartido, aún no desplegado).
  - `eest3` → `com.virttend.eest3` / EEST Nº3 Eva Perón — API: `https://eest3.virttend.app/api`.
- **Precedencia de URL de API:** `EXPO_PUBLIC_API_URL` > `extra.apiUrl` de la variante > `http://localhost:3001`.
- **Desarrollo sobre USB:** `pnpm --filter mobile android:usb` (flujo ADB reverse).
- **Builds:** EAS vía `.github/workflows/mobile-release.yaml` → APKs publicados en GitHub Releases en cada push a `main` que toque la app.
- **Funcionalidades implementadas:** Asistencia (diaria + por materia), branding, soporte offline y configuración.
- **Autenticación:** `src/config/app-config.ts`; la información de tenant proviene de `GET /config/public`, nunca hardcodeada.

### 3.5 `apps/site` (Landing Pública)
- **Tecnología:** Next.js (App Router, Server Components), desplegado en Vercel (`pnpm --filter site dev` → puerto 3002).
- **Propósito:** Landing pública estática: presentación del producto, planes, app móvil, FAQ, contacto, páginas de descarga y política de privacidad.
- **Sin backend.** JavaScript del lado cliente mínimo, únicamente para `PlatformScope` (detecta Android/iOS para priorizar el botón de descarga).
- **Dependencias internas:** Branding de `@repo/branding` y tokens de `@repo/ui/tokens.css`.
- **Páginas:**
  - `/` — Landing principal.
  - `/descargar` — Descarga general + listado de colegios.
  - `/descargar/[slug]` — Página de descarga por colegio con QR.
  - `/privacidad` — Política de privacidad (borrador, `noindex`).
  - `/blog` — Novedades y notas de versión (listado, más nueva primero); `/blog/[slug]` — entrada; `/blog/rss.xml` — feed RSS. Las entradas son archivos Markdown en `apps/site/content/blog/*.md` (frontmatter `title`, `date`, `summary`, opcionales `version` y `tags`; ver el `README.md` de esa carpeta). Se parsean en build con `gray-matter` + `marked` (HTML crudo escapado), 100% estático y sin JS de cliente.
- **Fuente de verdad de configuración de descarga:** `src/config/mobile-apps.ts`.
- **Variables de entorno clave:** `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_DEMO_URL` (default: `https://demo.virttend.app`), `NEXT_PUBLIC_APP_URL` (instancia compartida, oculta si no está definida), `NEXT_PUBLIC_CONTACT_EMAIL`.

### 3.6 `packages/branding`
- **Responsabilidad:** Lógica de branding agnóstica de framework, compartida por la API, `@repo/ui` y la app móvil.
- **Implementación:** Funciones puras + schemas Zod, sin dependencia de ningún framework.
- **Subpaths exportados:**
  - `@repo/branding` — Tipos, schemas, `VIRTTEND_BRANDING`, `resolveBranding`, `deriveBrandTokens`, utilidades de color, `resolveAssetUrl`.
  - `@repo/branding/web` — `toShadcnVars`, `brandStyleSheet` (CSS vars de shadcn).
  - `@repo/branding/native` — `toNativeWindVars`, `nativewindPrimaryColors`, `NATIVE_DEFAULT_VARS`.
  - `@repo/branding/marks` — Geometría y paleta del sello de Vir-ttend.
- **Schema (`brandingFileSchema`):** Valida `version`, `displayName`, `shortName`, `colors` (`primary`, `accent`, `highlight` en `#RRGGBB`), `assets` (`crest`, `crestSmall`, `crestSmallPng`, `favicon`).
- **Build:** `pnpm --filter @repo/branding build` (tsup).

### 3.7 `packages/common`
- **Responsabilidad:** Núcleo de tipos y validación agnóstico de framework.
- **Exportaciones clave:**
  - Enums de roles: `ROLES = { SUPERADMIN: 'SUPERADMIN', ADMIN: 'ADMIN', PRECEPTOR: 'PRECEPTOR', TEACHER: 'TEACHER' }`.
  - Predicados de autorización: `isPathAllowedForRole(role, pathname)`.
  - Schemas Zod y DTOs para autenticación, estudiantes, asistencia, alertas, cursos y comunicados.

### 3.8 `packages/hooks`
- **Responsabilidad:** Capa de datos reactiva para el frontend.
- **Tecnología:** TanStack Query (`@tanstack/react-query`) + Axios con `withCredentials: true`.
- **Contenido:** Claves de consulta centralizadas (`keys.ts`) y hooks como `useAuth`, `useStudents`, `useAttendance`, `useAlerts`, `useReports`, etc.

### 3.9 `packages/ui`
- **Responsabilidad:** Design System y componentes de presentación.
- **Componentes:** Componentes base accesibles inspirados en Radix UI / shadcn (Button, Dialog, Table, Form, Select, Toaster, etc.) y layouts integrados (`DashboardLayout`, `Sidebar`, `Forbidden`, `LoadingSpinner`).

---

## 4. Invariantes Arquitectónicas y Reglas de Oro

Cuando generes o modifiques código en este repositorio, **debes cumplir estrictamente estas reglas**:

1. **No mezclar contextos de dominio:**
   - Un Aggregate Root de un Bounded Context **nunca** debe contener una referencia directa a un Aggregate Root de otro contexto. Solo almacena su ID (ej: `AttendanceRecord` almacena `studentId: string`, no la entidad `Student`).
2. **Respetar Clean Architecture en la API:**
   - Dominio (`domain/`): Entidades, Value Objects, Domain Events e interfaces de repositorios. Sin dependencias de NestJS ni MikroORM.
   - Aplicación (`application/`): Command Handlers, Query Handlers y DTOs internos.
   - Infraestructura (`infrastructure/`): Mapeadores ORM, repositorios concretos MikroORM, clientes Redis.
   - Presentación (`presentation/`): Controllers HTTP de NestJS con DTOs validados mediante `class-validator` y documentación Swagger.
3. **No realizar queries ad-hoc en el frontend:**
   - Los componentes de `apps/client` deben consumir data a través de los custom hooks de `@repo/hooks`. No instancies clientes HTTP locales ni hagas `fetch` directo si existe o corresponde un hook en el paquete compartido.
4. **Contratos compartidos centralizados:**
   - Cualquier tipo, enum, DTO o schema de validación que deba conocerse entre cliente y servidor debe residir en `packages/common`.
5. **Multi-tenancy y Aislamiento:**
   - En base de datos, las entidades pertenecientes a un tenant deben incluir `tenantId`.
   - No eliminar `tenantId` ni las políticas de seguridad aunque se opere en modo single-tenant (ver [docs/tenancy-single-tenant.md](docs/tenancy-single-tenant.md)).
6. **Manejo de base de datos:**
   - No modificar el esquema de PostgreSQL mediante `schema:update` en caliente. Siempre generar y versionar migraciones con MikroORM (`pnpm mikro-orm migration:create`).

---

## 5. Matriz de Variables de Entorno

### Backend (`apps/api/.env`)
| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto HTTP del servidor | `3001` |
| `DATABASE_URL` | Conexión PostgreSQL | `postgresql://virttend:2026virttend@localhost:5436/vir_ttend` |
| `REDIS_URL` | Conexión Redis | `redis://localhost:6379` |
| `JWT_SECRET` | Firma de Access Tokens JWT | `secreto_super_seguro` |
| `JWT_REFRESH_SECRET` | Firma de Refresh Tokens | `secreto_refresh_super_seguro` |
| `CORS_ORIGINS` | Orígenes permitidos (separados por coma) | `http://localhost:3000,http://localhost:3002` |
| `TENANCY_MODE` | Modo de despliegue (`multi` o `single`) | `multi` |
| `TENANT_ID` | Obligatorio solo si `TENANCY_MODE=single` | `uuid-del-colegio` |
| `TENANT_SLUG` | Slug identificador en modo single | `colegio-san-martin` |

### Frontend (`apps/client/.env.local`)
| Variable | Descripción | Ejemplo |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL accesible de la API NestJS | `http://localhost:3001` |

---

## 6. Comandos Operativos de Referencia

```bash
# Instalación limpia
pnpm install

# Compilación de paquetes base (imprescindible antes de correr apps)
pnpm --filter @repo/common build
pnpm --filter @repo/hooks build

# Desarrollo
pnpm dev                       # Todas las apps vía Turborepo
pnpm --filter api dev          # Solo Backend
pnpm --filter client dev       # Solo Frontend Client
pnpm --filter demo dev         # Solo Demo Comercial
pnpm --filter site dev         # Solo Landing Pública
pnpm --filter mobile android:usb  # App móvil sobre USB (ADB reverse)

# Base de datos (MikroORM)
cd apps/api
pnpm mikro-orm migration:create -- --name=nombre_migracion
pnpm mikro-orm migration:up
pnpm mikro-orm migration:down

# Tests
pnpm test                      # Todo el monorepo
pnpm --filter api test         # Tests unitarios del backend (Jest)
pnpm --filter demo test        # Tests del store y utilidades de demo

# Lint y Formato (Biome)
pnpm lint:check
pnpm lint:fix
pnpm ts:check
```

---

## 7. Referencias Cruzadas de Documentación

- **Arquitectura Detallada:** [docs/TECHNICAL_DOCUMENTATION.md](docs/TECHNICAL_DOCUMENTATION.md)
- **Estrategia Single-Tenant:** [docs/tenancy-single-tenant.md](docs/tenancy-single-tenant.md)
- **README Principal:** [README.md](README.md)
- **README Backend:** [apps/api/README.md](apps/api/README.md)
- **README Frontend:** [apps/client/README.md](apps/client/README.md)
- **README Demo Comercial:** [apps/demo/README.md](apps/demo/README.md)
