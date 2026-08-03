# Sprint 00 — Foundation (Frontend)

> **Objetivo:** Sellar el contrato `@repo/common`, arreglar los bugs de `@repo/hooks`, configurar el shell del App Router y el tooling frontend. Es la base sobre la que se construyen todos los sprints siguientes.
> **Duración:** 1 semana · **Estimación:** 40 h · **Dependencias:** ninguna

---

## Decisiones de diseño

**Naming de paquetes:** se mantiene `@repo/*` (código real). Los docs pasan a usar `@repo/*` para eliminar la ambigüedad con `@vir-ttend/*`. Renombrar rompería `apps/api` (no es frontend only).

**Contrato en `@repo/common`:** es la única fuente de verdad de rutas, tipos y constantes. En este sprint se completa para cubrir todos los endpoints que expone la API (`apps/api/README.md`). Si un hook necesita una ruta que no existe en common, primero se agrega al contrato.

**`@repo/hooks` es el único lugar que fetchea.** Se corrigen los dos bugs del `apiClient` (import relativo + interceptor de refresh en el lugar incorrecto).

**`apps/client` no fetchea y no tiene lógica de negocio.** El RootLayout monta providers; las páginas son server components ligeros.

---

## Resumen de horas

| Área | Horas |
|---|---|
| `@repo/common` — tipos, rutas, constantes, schemas | 10 |
| `@repo/hooks` — apiClient fix + QueryClient + keys + providers | 8 |
| `@repo/ui` — shared: data-table + barrel central + primitives faltantes | 8 |
| `apps/client` — shell App Router, layout global, loading/error/not-found | 8 |
| Tooling: Vitest/Testing Library, biome, env | 6 |
| **Total** | **40** |

---

## 1. `@repo/common` — completar el contrato

### 1.1 Rutas faltantes (nuevos archivos)

```
packages/common/src/routes/
├── tenant.routes.ts        # TENANT_ROUTES
├── user.routes.ts          # USER_ROUTES
├── announcement.routes.ts  # ANNOUNCEMENT_ROUTES
└── dashboard.routes.ts     # DASHBOARD_ROUTES
```

```ts
// tenant.routes.ts
export const TENANT_ROUTES = {
  tenants: '/tenants',
  tenant:  (id: string) => `/tenants/${id}`,
  status:  (id: string) => `/tenants/${id}/status`,
} as const;

// user.routes.ts
export const USER_ROUTES = {
  users:     '/users',
  me:        '/users/me',
  changeRole: (id: string) => `/users/${id}/role`,
} as const;

// announcement.routes.ts
export const ANNOUNCEMENT_ROUTES = {
  announcements: '/announcements',
  forMe:         '/announcements/for-me',
  announcement:  (id: string) => `/announcements/${id}`,
  publish:       (id: string) => `/announcements/${id}/publish`,
} as const;

// dashboard.routes.ts
export const DASHBOARD_ROUTES = {
  dashboard:          '/dashboard',
  dashboardCourse:    (courseId: string) => `/dashboard/course/${courseId}`,
  dashboardMetrics:   '/dashboard/metrics',
} as const;
```

> **Nota:** `AUTH_ROUTES` tiene un typo real: `selectTenant: 'auth/select-tenant'` (falta el `/` inicial). Corregir a `'/auth/select-tenant'`.

### 1.2 Tipos de respuesta por dominio

```
packages/common/src/types/
├── auth/
│   ├── login.response.type.ts      # LoginResponse { isSuperAdmin, userId, tenants: TenantOption[] }
│   ├── tenant-option.type.ts       # { tenantId, tenantName, role }
│   └── user.response.type.ts       # CurrentUser { id, email, firstName, lastName, role, tenantId, mustChangePassword }
├── attendance/
│   ├── attendance-record.response.type.ts   # id, studentId, studentName, status, subjectId?, justification?
│   ├── daily-attendance.response.type.ts    # date, courseId, records[], metrics
│   └── attendance-metrics.response.type.ts  # totalStudents, present, absent, late, justified, absentPercent, studentsAtRisk[]
├── alerts/
│   ├── alert.response.type.ts      # id, studentId, studentName, courseId, courseName, alertType, absencePercent, seenAt, createdAt
│   └── alerts-count.response.type.ts
├── dashboard/
│   ├── course-snapshot.type.ts     # courseId, courseName, level, totalStudents, present, absent, late, justified, notRecorded, statusColor, lastUpdated
│   ├── preceptor-dashboard.response.type.ts
│   └── dashboard-metrics.response.type.ts
├── reports/
│   ├── monthly-report.response.type.ts   # courseName, period, workingDays, students[], summary
│   ├── student-report.response.type.ts
│   └── course-summary.response.type.ts
├── announcements/
│   └── announcement.response.type.ts  # id, title, body, targetType, targetId, status, publishAt, authorName, createdAt
└── tenants/
    └── tenant.response.type.ts      # id, name, subdomain, contactEmail, isActive, createdAt
```

Todos re-exportados desde `src/index.ts` (con `.js` en los imports, como ya se hace).

### 1.3 Schemas Zod (primeros tres; el resto llega con cada feature)

```
packages/common/src/schemas/
├── auth.schema.ts        # loginSchema (email, password)
├── student.schema.ts     # createStudentSchema
└── attendance.schema.ts  # attendanceStatusSchema, registerDailySchema
```

> Zod debe agregarse como dependencia de `@repo/common` (hoy no lo tiene). Con `z.infer` se derivan los tipos para los forms.

### 1.4 Verificación del contrato

- `pnpm --filter @repo/common build` compila sin errores.
- Un test de smoke importa `AUTH_ROUTES`, `STUDENT_ROUTES`, `REPORT_ROUTES` desde `@repo/common` y valida que las rutas coinciden con la tabla de endpoints del `apps/api/README.md`.

---

## 2. `@repo/hooks` — fixes y base

### 2.1 `lib/axios-client.ts` — corregir

```ts
import axios from 'axios';
import { AUTH_ROUTES } from '@repo/common';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// INTERCEPTOR DE RESPUESTA (antes estaba mal en request)
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
  },
);
```

### 2.2 `providers/tanstack-provider.tsx` — configurar QueryClient

```ts
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,   // 2 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const TanstackProvider = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
```

### 2.3 `keys.ts` — factory de query keys

```ts
export const queryKeys = {
  auth: { me: ['auth', 'me'] },
  tenants: { all: ['tenants'] },
  academicYears: { all: ['academic-years'] },
  courses: { list: (filters) => ['courses', 'list', filters], detail: (id) => ['courses', 'detail', id] },
  students: { list: (filters) => ['students', 'list', filters], detail: (id) => ['students', 'detail', id] },
  attendance: { daily: (courseId, date) => ['attendance', 'daily', courseId, date] },
  alerts: { count: ['alerts', 'count'], unseen: ['alerts', 'unseen'] },
  reports: { monthly: (courseId, month, year) => ['reports', 'monthly', courseId, month, year] },
  announcements: { all: (filters) => ['announcements', 'list', filters], forMe: ['announcements', 'for-me'] },
} as const;
```

---

## 3. `@repo/ui` — base compartida

### 3.1 Componentes `shared` nuevos

```
packages/ui/src/components/shared/
├── data-table/                  # wrapper de TanStack Table (@tanstack/react-table ya está)
│   ├── data-table.tsx           # Props: columns, data, isLoading, pagination?
│   ├── data-table-pagination.tsx
│   └── index.ts
├── page-header.tsx              # (ya existe — verificar props: title, subtitle, actions)
├── empty-state.tsx              # (ya existe)
├── error-state.tsx              # (ya existe — agregar onRetry)
└── loading-spinner.tsx          # (ya existe)
```

### 3.2 Primitivas faltantes (verificar en `src/ui/`)

- `tabs`, `radio-group`, `switch`, `checkbox`, `command`, `avatar`, `scroll-area`, `chart` ya existen. Revisar que `src/index.tsx` re-exporte lo que los features van a necesitar y completar exportaciones faltantes.

### 3.3 `lib` de utilidades

```
packages/ui/src/lib/
├── utils.ts     # cn() (ya existe)
└── format.ts    # formatDate (date-fns), formatPercent, formatFullName
```

---

## 4. `apps/client` — shell del App Router

### 4.1 Layout global

```tsx
// apps/client/src/app/layout.tsx
import { TanstackProvider } from '@repo/hooks';
import { Toaster } from '@repo/ui';
import { AuthProvider } from '@/lib/auth/provider';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <TanstackProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </TanstackProvider>
      </body>
    </html>
  );
}
```

### 4.2 Archivos globales

- `loading.tsx` — skeleton global usando `LoadingSpinner`/`Skeleton` de `@repo/ui`.
- `error.tsx` — error boundary global con botón retry.
- `not-found.tsx` — 404 estilizado.
- `page.tsx` — redirige según sesión: `/login` o `/dashboard`.

### 4.3 `lib/auth/provider.tsx` — reemplazar placeholder

```tsx
// Contexto con: user, tenant, isAuthenticated, isLoading
// setUser(user), clearUser()
// En este sprint solo la forma; el fetching real se conecta en Sprint 01
```

---

## 5. Tooling

- **Testing:** instalar `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` en `packages/ui` y `packages/hooks`. Configurar `vitest.config.ts` en cada paquete.
- **Env:** crear `apps/client/.env.local.example` con `NEXT_PUBLIC_API_URL=http://localhost:3001`.
- **Biome:** verificar que `biome check` cubre `apps/client`, `packages/ui`, `packages/hooks`, `packages/common`.

---

## 6. Tareas por día

### Día 1–2: Contrato `@repo/common`
- [ ] Corregir `AUTH_ROUTES.selectTenant`
- [ ] Crear `tenant.routes.ts`, `user.routes.ts`, `announcement.routes.ts`, `dashboard.routes.ts`
- [ ] Tipos de respuesta por dominio (auth, attendance, alerts, dashboard, reports, announcements, tenants)
- [ ] Instalar Zod y crear los 3 schemas iniciales
- [ ] `pnpm --filter @repo/common build` en verde

### Día 3: `@repo/hooks`
- [ ] Fix interceptor de refresh (a `interceptors.response`) e import desde `@repo/common`
- [ ] Configurar QueryClient en `TanstackProvider`
- [ ] Crear `keys.ts`
- [ ] Test unitario del interceptor (401 → refresh → retry)

### Día 4: `@repo/ui`
- [ ] Crear `data-table` (TanStack Table)
- [ ] Completar re-exports de `src/index.tsx`
- [ ] Crear `lib/format.ts`

### Día 5–6: `apps/client`
- [ ] RootLayout con providers
- [ ] `loading.tsx`, `error.tsx`, `not-found.tsx`, `page.tsx` con redirect por sesión
- [ ] Reemplazar `lib/auth/provider.tsx` placeholder por el contexto con estado
- [ ] Corregir `next.config.mjs` si hace falta (transpilePackages ya incluye los 3 paquetes)

### Día 7: Integración y verificación
- [ ] `pnpm build` respeta el orden common → hooks → ui → client
- [ ] `GET /health` alcanzable desde el browser con CORS (`http://localhost:3001`)
- [ ] `biome check` y `tsc --noEmit` en verde en los 4 paquetes
- [ ] `apps/client` no importa axios ni react-query

---

## 7. Criterios de aceptación

- [ ] `@repo/common` exporta rutas y tipos para **todos** los endpoints de la API
- [ ] `AUTH_ROUTES.selectTenant` corregido
- [ ] El interceptor de refresh está en `interceptors.response` y reintenta una sola vez
- [ ] `apps/client` muestra skeleton/error/404 propios
- [ ] RootLayout monta `TanstackProvider`, `AuthProvider` y `Toaster`
- [ ] `pnpm --filter @repo/common build`, `pnpm build` y `pnpm lint:check` pasan
- [ ] `apps/client` no importa axios ni `@tanstack/react-query` directamente
- [ ] Ninguna URL de API hardcodeada fuera de `@repo/common/routes`

---

**Siguiente sprint →** [Sprint 01: Autenticación y Sesión](./sprint-01-auth-session.md)
