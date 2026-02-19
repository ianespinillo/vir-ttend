# Sprint 00 — Foundation

> **Objetivo:** Configurar el monorepo, la infraestructura base de NestJS con arquitectura hexagonal, el frontend Next.js y el entorno de desarrollo local.
> **Duración:** 1 semana · **Estimación:** 40 h · **Dependencias:** ninguna

---

## Arquitectura de paquetes — decisión de diseño

Antes de listar archivos, es importante entender el criterio de dónde vive cada cosa:

| Paquete | Responsabilidad | Consumido por |
|---|---|---|
| `packages/common` | Tipos, constantes y **rutas de la API** — contrato compartido | `apps/api`, `packages/hooks`, `packages/ui` |
| `packages/hooks` | Axios client + hooks de TanStack Query — todo el fetching | `packages/ui`, `apps/client` (casos excepcionales) |
| `packages/ui` | Componentes React — consume hooks, no fetchea directamente | `apps/client` |
| `apps/client` | Solo páginas Next.js + `AuthContext` (estado React) | — |
| `apps/api` | Backend NestJS | — |

**Por qué las rutas van en `common`:** son un contrato entre quien las expone (backend) y quien las consume (hooks). Si cambia una ruta, TypeScript avisa en todos los consumidores al mismo tiempo.

**Por qué axios vive en `packages/hooks`:** axios con `withCredentials: true` maneja las cookies HttpOnly automáticamente a nivel browser sin requerir configuración específica de Next.js. Los hooks son quienes fetchean, así que el cliente HTTP vive junto a ellos.

**Por qué `apps/client` no tiene `lib/api/`:** el cliente no fetchea nada por sí mismo. Solo presenta páginas que importan componentes de `packages/ui` (que usan hooks de `packages/hooks`). Lo único que vive en `apps/client/src/lib/` es el `AuthContext`, que es estado React puro, no fetching.

---

## Resumen de horas

| Área | Horas |
|---|---|
| Monorepo & tooling | 8 |
| Backend foundation | 16 |
| Frontend foundation | 10 |
| Infra / DevOps local | 4 |
| Configuración de paquetes | 2 |
| **Total** | **40** |

---

## 1. Monorepo & Tooling

### 1.1 Archivos raíz

```
/
├── package.json                    # workspace root — define workspaces pnpm
├── pnpm-workspace.yaml             # lista apps/* y packages/*
├── turbo.json                      # pipelines: build, dev, lint, test
├── biome.json                      # linting + formatting (reemplaza eslint+prettier)
├── commitlint.config.js            # conventional commits
├── .husky/
│   ├── pre-commit                  # ejecuta biome check
│   └── commit-msg                  # ejecuta commitlint
├── .gitignore
└── .nvmrc                          # node 20 LTS
```

### 1.2 `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### 1.3 `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build":  { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "dev":    { "cache": false, "persistent": true },
    "lint":   { "outputs": [] },
    "test":   { "outputs": ["coverage/**"] }
  }
}
```

---

## 2. Paquete `packages/common`

> Tipos, constantes y rutas de la API como contrato compartido entre backend y frontend.
> **Regla:** si tanto el backend como el frontend necesitan conocerlo, va aquí.

```
packages/common/
├── package.json                    # name: @vir-ttend/common — sin dependencias de runtime
├── tsconfig.json
└── src/
    ├── index.ts                    # re-exporta todo
    ├── types/
    │   ├── index.ts
    │   ├── tenant.types.ts         # TenantId, UserId, UserRole, JwtPayload
    │   └── api.types.ts            # ApiResponse<T>, PaginatedResponse<T>, ApiError
    ├── constants/
    │   ├── index.ts
    │   ├── roles.ts                # ROLES const + Role type
    │   └── attendance-status.ts   # ATTENDANCE_STATUS + AttendanceStatus + ATTENDANCE_THRESHOLDS
    └── routes/
        ├── index.ts                # re-exporta todas las rutas
        ├── auth.routes.ts          # AUTH_ROUTES
        ├── academic.routes.ts      # ACADEMIC_ROUTES
        ├── attendance.routes.ts    # ATTENDANCE_ROUTES
        ├── students.routes.ts      # STUDENT_ROUTES
        ├── alerts.routes.ts        # ALERT_ROUTES
        └── reports.routes.ts       # REPORT_ROUTES
```

### `types/tenant.types.ts`

```ts
export type TenantId = string;
export type UserId   = string;
export type UserRole = 'superadmin' | 'admin' | 'preceptor' | 'teacher';

export interface JwtPayload {
  sub:      UserId;
  tenantId: TenantId;
  role:     UserRole;
  email:    string;
  iat?:     number;
  exp?:     number;
}
```

### `types/api.types.ts`

```ts
export interface ApiResponse<T> {
  success:   boolean;
  data:      T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items:      T[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message:    string | string[];
  error:      string;
  timestamp:  string;
  path:       string;
}
```

### `constants/roles.ts`

```ts
export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN:      'admin',
  PRECEPTOR:  'preceptor',
  TEACHER:    'teacher',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
```

### `constants/attendance-status.ts`

```ts
export const ATTENDANCE_STATUS = {
  PRESENT:   'present',
  ABSENT:    'absent',
  LATE:      'late',
  JUSTIFIED: 'justified',
} as const;

export type AttendanceStatus = typeof ATTENDANCE_STATUS[keyof typeof ATTENDANCE_STATUS];

// Fuente de verdad única para semáforos del dashboard (Sprint 07) y badges de alerta (Sprint 08)
export const ATTENDANCE_THRESHOLDS = {
  WARNING:  75,
  CRITICAL: 85,
} as const;
```

### `routes/auth.routes.ts`

```ts
// Patrón: constantes tipadas que sirven como contrato entre backend y hooks.
// El backend las usa para documentar sus endpoints.
// Los hooks las importan para construir las URLs de los requests.
// Si cambia una ruta, TypeScript avisa en todos los consumidores.

export const AUTH_ROUTES = {
  register: '/auth/register',
  login:    '/auth/login',
  logout:   '/auth/logout',
  refresh:  '/auth/refresh',
  me:       '/users/me',
} as const;
```

### `routes/academic.routes.ts`

```ts
export const ACADEMIC_ROUTES = {
  academicYears:    '/academic-years',
  academicYear:     (id: string) => `/academic-years/${id}`,
  courses:          '/courses',
  course:           (id: string) => `/courses/${id}`,
  coursePreceptor:  (id: string) => `/courses/${id}/preceptor`,
  subjects:         '/subjects',
  subject:          (id: string) => `/subjects/${id}`,
  subjectTeacher:   (id: string) => `/subjects/${id}/teacher`,
  schedule:         '/schedule',
} as const;
```

### `routes/attendance.routes.ts`

```ts
export const ATTENDANCE_ROUTES = {
  daily:            '/attendance/daily',
  dailyAll:         '/attendance/daily/all',
  subject:          '/attendance/subject',
  subjectAll:       '/attendance/subject/all',
  subjectCopy:      '/attendance/subject/copy',
  subjectHistory:   (subjectId: string) => `/attendance/subject/${subjectId}/history`,
  justify:          (id: string) => `/attendance/${id}/justify`,
  metrics:          '/attendance/metrics',
  history:          '/attendance/history',
  byStudent:        (studentId: string) => `/attendance/student/${studentId}`,
  teacherSubjects:  '/attendance/teacher/subjects',
  dashboard:        '/dashboard',
  dashboardCourse:  (courseId: string) => `/dashboard/course/${courseId}`,
  dashboardMetrics: '/dashboard/metrics',
} as const;
```

### `routes/students.routes.ts`

```ts
export const STUDENT_ROUTES = {
  students: '/students',
  student:  (id: string) => `/students/${id}`,
  search:   '/students/search',
  enroll:   (id: string) => `/students/${id}/enroll`,
  transfer: (id: string) => `/students/${id}/transfer`,
} as const;
```

### `routes/alerts.routes.ts`

```ts
export const ALERT_ROUTES = {
  alerts:    '/alerts',
  unseen:    '/alerts/unseen',
  count:     '/alerts/count',
  seen:      (id: string) => `/alerts/${id}/seen`,
  generate:  '/alerts/generate',
  byStudent: (studentId: string) => `/alerts/student/${studentId}`,
} as const;
```

### `routes/reports.routes.ts`

```ts
export const REPORT_ROUTES = {
  monthly:       '/reports/monthly',
  generate:      '/reports/generate',
  courseSummary: (courseId: string) => `/reports/course/${courseId}/summary`,
  available:     (courseId: string) => `/reports/course/${courseId}/available`,
  byStudent:     (studentId: string) => `/reports/student/${studentId}`,
  exportExcel:   '/reports/export/excel',
  exportPdf:     '/reports/export/pdf',
} as const;
```

---

## 3. Paquete `packages/hooks`

> Axios client y todos los hooks de TanStack Query.
> Es el único lugar donde ocurre fetching en el frontend.
> En este sprint solo se configura la estructura base. Los hooks concretos se crean desde Sprint 01.

```
packages/hooks/
├── package.json                    # name: @vir-ttend/hooks
│                                   # deps: axios, @tanstack/react-query, react
├── tsconfig.json
└── src/
    ├── index.ts                    # re-exporta hooks públicos — NO re-exporta axios-client
    └── lib/
        └── axios-client.ts         # instancia axios compartida — interna al paquete
```

### `src/lib/axios-client.ts`

```ts
import axios from 'axios';
import { AUTH_ROUTES } from '@vir-ttend/common';

// Instancia de axios compartida por todos los hooks del paquete.
// Es interna: no se exporta en index.ts, solo se importa dentro de packages/hooks.

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  withCredentials: true,   // el browser adjunta automáticamente las cookies HttpOnly
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor de respuesta: si el backend devuelve 401, intenta renovar
// el access token usando el refresh token (presente en la cookie HttpOnly)
// y reintenta el request original una sola vez.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      await apiClient.post(AUTH_ROUTES.refresh);
      return apiClient(originalRequest);
    }
    return Promise.reject(error);
  }
);
```

---

## 4. Backend — `apps/api`

### 4.1 Entrypoint y módulo raíz

```
apps/api/src/
├── main.ts                         # bootstrap: pipes, filters, interceptors, CORS, cookie-parser
└── app.module.ts                   # importa shared modules y feature modules
```

### `main.ts` — comportamiento

```ts
// - ValidationPipe: whitelist, forbidNonWhitelisted, transform
// - HttpExceptionFilter global → respuestas con forma ApiError de @vir-ttend/common
// - LoggingInterceptor global → loguea método, url, status, duración
// - TransformInterceptor global → envuelve en ApiResponse<T> (excluye Buffer/streams)
// - cookieParser() para leer cookies HttpOnly del request
// - CORS: origin: process.env.CLIENT_URL, credentials: true
```

### 4.2 Configuración global

```
apps/api/src/config/
├── app.config.ts                   # PORT, NODE_ENV, CLIENT_URL
├── database.config.ts              # MikroORM: host, port, dbName, entities path
├── redis.config.ts                 # Redis: host, port, password
└── jwt.config.ts                   # secrets y expiración de access/refresh token
```

### `jwt.config.ts`

```ts
export const jwtConfig = {
  accessToken:  { secret: process.env.JWT_SECRET,         expiresIn: '15m' },
  refreshToken: { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d'  },
};
```

### 4.3 Common — filtros, interceptores, guards y decorators

```
apps/api/src/common/
├── filters/
│   └── http-exception.filter.ts   # Captura HttpException y errores no controlados
│                                   # Siempre devuelve forma ApiError de @vir-ttend/common
│                                   # Nunca expone stack trace en producción
├── interceptors/
│   ├── logging.interceptor.ts     # Loguea método, url, status y duración con NestJS Logger
│   └── transform.interceptor.ts   # Envuelve respuestas exitosas en ApiResponse<T>
│                                   # Detecta Buffer y lo excluye (para exports de archivos)
├── decorators/
│   ├── current-user.decorator.ts  # @CurrentUser() → JwtPayload del request (seteado por JwtStrategy)
│   ├── roles.decorator.ts         # @Roles(...roles) → metadata para RolesGuard
│   └── tenant.decorator.ts        # @Tenant() → tenantId del request
├── guards/
│   ├── auth.guard.ts              # Placeholder — se implementa en Sprint 01
│   ├── roles.guard.ts             # Placeholder — se implementa en Sprint 02
│   └── tenant.guard.ts            # Placeholder — se implementa en Sprint 02
└── constants/
    └── roles.ts                   # Re-exporta ROLES de @vir-ttend/common
```

### 4.4 Shared — base entities

```
apps/api/src/shared/database/
├── entities/
│   ├── base.entity.ts              # id: UUIDv4, createdAt, updatedAt — extendida por todas
│   └── tenant-base.entity.ts      # extiende BaseEntity + tenantId: string
└── migrations/                    # vacío — se puebla en cada sprint al agregar entidades
```

### 4.5 Shared — módulos de infraestructura

```
apps/api/src/shared/
├── database/
│   └── mikro-orm.config.ts         # type: postgresql, autoLoadEntities: true
│                                   # migrations.path: './src/shared/database/migrations'
├── cache/
│   └── cache.module.ts             # CacheModule con Redis (ioredis) — @Global()
└── events/
    └── event-bus.module.ts         # EventEmitterModule.forRoot() — @Global()
                                    # Solo infraestructura, los eventos se definen desde Sprint 05
```

### 4.6 `.env.example`

```bash
# API
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/virttend

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=change_me_in_production
JWT_REFRESH_SECRET=change_me_refresh_in_production
```

---

## 5. Frontend — `apps/client`

> Solo páginas Next.js. No fetchea, no tiene lógica de negocio, no tiene componentes propios.
> Todo componente visual → `packages/ui`. Todo fetching → `packages/hooks`.

### 5.1 Páginas base

```
apps/client/src/app/
├── layout.tsx                      # RootLayout: monta QueryClientProvider y AuthProvider
│                                   # importa globals.css de @vir-ttend/ui
├── page.tsx                        # Lee AuthContext → redirige a /dashboard o /login
├── loading.tsx                     # Skeleton global de carga (usa componentes de @vir-ttend/ui)
├── error.tsx                       # Error boundary global
└── not-found.tsx                   # Página 404
```

### 5.2 Lo único que vive en `apps/client/src/lib/`

```
apps/client/src/lib/
└── auth/
    └── provider.tsx                # AuthContext y AuthProvider
                                    # Estado: user: UserResponseDto | null, isAuthenticated, isLoading
                                    # Métodos: setUser(user), clearUser()
                                    # No fetchea — los hooks de @vir-ttend/hooks llaman
                                    # setUser tras login exitoso y clearUser tras logout
```

> No hay `lib/api/`, no hay `lib/api/client.ts`, no hay `lib/api/endpoints.ts`.
> Las rutas están en `@vir-ttend/common/routes`.
> El cliente HTTP está en `packages/hooks/src/lib/axios-client.ts`.

---

## 6. Paquete `packages/ui`

```
packages/ui/
├── package.json                    # name: @vir-ttend/ui
│                                   # deps: react, react-hook-form, zod, tailwindcss, lucide-react, etc.
├── tsconfig.json
└── src/
    ├── index.ts                    # re-exporta todos los componentes
    ├── styles/
    │   └── globals.css             # Tailwind base + variables CSS custom
    ├── lib/
    │   └── utils/
    │       ├── cn.ts               # clsx + tailwind-merge
    │       └── date.ts             # formatDate, formatRelative
    └── components/
        ├── ui/                     # componentes shadcn/ui base (sin lógica de negocio)
        │   ├── button.tsx
        │   ├── input.tsx
        │   ├── card.tsx
        │   ├── badge.tsx
        │   ├── dialog.tsx
        │   ├── dropdown-menu.tsx
        │   ├── label.tsx
        │   ├── select.tsx
        │   ├── skeleton.tsx
        │   ├── table.tsx
        │   ├── toast.tsx
        │   └── tooltip.tsx
        └── shared/
            ├── loading-spinner.tsx # Props: size: 'sm' | 'md' | 'lg'
            ├── empty-state.tsx     # Props: icon, title, description, action?
            ├── error-state.tsx     # Props: message, onRetry
            └── page-header.tsx     # Props: title, subtitle?, actions?: ReactNode
```

---

## 7. Infra / DevOps local

```
/
└── docker-compose.yml
```

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: virttend
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports: ["5432:5432"]
    volumes: ["postgres_data:/var/lib/postgresql/data"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

volumes:
  postgres_data:
```

---

## 8. Grafo de dependencias entre paquetes

```
@vir-ttend/common
    ↑           ↑           ↑
packages/hooks  apps/api    packages/ui
    ↑                           ↑
packages/ui                 apps/client
    ↑
apps/client
```

Reglas que nunca se rompen:
- `packages/common` no importa de nadie
- `packages/hooks` importa solo de `@vir-ttend/common`
- `packages/ui` importa de `@vir-ttend/common` y `@vir-ttend/hooks`
- `apps/client` importa de `@vir-ttend/ui` y (excepcionalmente) `@vir-ttend/hooks`
- `apps/api` importa de `@vir-ttend/common`
- Nadie importa de `apps/*`

---

## 9. Dependencias a instalar por paquete

| Paquete | Dependencias clave |
|---|---|
| `packages/common` | — (solo TypeScript, sin runtime) |
| `packages/hooks` | `axios`, `@tanstack/react-query`, `react` |
| `packages/ui` | `react`, `react-hook-form`, `zod`, `@hookform/resolvers`, `tailwindcss`, `clsx`, `tailwind-merge`, `lucide-react`, `class-variance-authority` |
| `apps/client` | `next`, `react`, `react-dom` |
| `apps/api` | NestJS + MikroORM + ioredis + class-validator + cookie-parser + uuid |

---

## 10. Tareas por día

### Día 1–2: Monorepo y `packages/common`
- [ ] Configurar `pnpm-workspace.yaml`, `turbo.json`, Biome, Husky, Commitlint
- [ ] Inicializar `packages/common`: tipos, constantes y **todas las rutas**
- [ ] Configurar TypeScript paths: `@vir-ttend/common`, `@vir-ttend/hooks`, `@vir-ttend/ui`
- [ ] Verificar que `AUTH_ROUTES.login` es importable desde cualquier paquete

### Día 3–4: Backend Foundation
- [ ] Inicializar `apps/api` con NestJS CLI
- [ ] Crear `main.ts` con pipes, filtros e interceptores globales
- [ ] Crear `BaseEntity` y `TenantBaseEntity`
- [ ] Configurar MikroORM con PostgreSQL
- [ ] Crear `CacheModule` (Redis) y `EventBusModule`
- [ ] Crear archivos de `common/` (filters, interceptors, decorators, guards placeholder)

### Día 5: Frontend Foundation
- [ ] Inicializar `apps/client` con Next.js App Router
- [ ] Configurar Tailwind + shadcn/ui en `packages/ui`
- [ ] Crear componentes base: `loading-spinner`, `empty-state`, `error-state`, `page-header`
- [ ] Inicializar `packages/hooks` con `axios-client.ts` interno
- [ ] Crear `AuthProvider` placeholder en `apps/client/src/lib/auth/provider.tsx`

### Día 6–7: Integración y verificación
- [ ] Levantar `docker-compose.yml` y verificar PostgreSQL y Redis
- [ ] Verificar `pnpm dev` levanta api (`localhost:3001`) y client (`localhost:3000`)
- [ ] Generar migración inicial (vacía) con MikroORM CLI
- [ ] Verificar que `apiClient` de `packages/hooks` llega al `GET /health` de `apps/api`

---

## 11. Criterios de aceptación

- [ ] `pnpm install` sin errores en todos los workspaces
- [ ] `pnpm build` respeta el orden: `common` → `hooks` → `ui` → `client` / `api`
- [ ] `GET /health` en `apps/api` responde `{ status: 'ok' }`
- [ ] `AUTH_ROUTES.login` importado desde `@vir-ttend/common` es accesible en `packages/hooks` y en `apps/api`
- [ ] `apiClient` (interno de `packages/hooks`) alcanza `apps/api` con `withCredentials: true`
- [ ] TypeScript sin errores en todos los paquetes
- [ ] `apps/client` no tiene ningún import directo de `axios` ni `@tanstack/react-query`

---

**Siguiente sprint →** Sprint 01: Autenticación JWT
