# Vir-ttend — Plan de Reestructuración y Roadmap del Frontend

> **Versión:** 1.0  
> **Fecha:** Agosto 2026  
> **Alcance:** Solo frontend (`apps/client`, `packages/ui`, `packages/hooks`, `packages/common`)
> **Base:** `doc/TECHNICAL_DOCUMENTATION.md`, `doc/ui/DIRECTORY_STRUCTURE.md`, `doc/planning/sprints/*`, `apps/api/README.md`

---

## 1. Contexto

Vir-ttend es un SaaS multi-tenant de gestión de asistencia escolar (primaria y secundaria). El **backend (NestJS) está completo y testeado** (40 specs, 202 tests unitarios): autenticación JWT multi-tenant con roles, académico, estudiantes, asistencia diaria/por materia, alertas, dashboards, reportes y exportación Excel/PDF.

El **frontend, en cambio, está prácticamente vacío**. Lo que existe hoy:

| Paquete | Estado real |
|---|---|
| `apps/client` | Next.js 16 template (`create-next-app`) + `src/lib/auth/provider.tsx` placeholder |
| `packages/ui` | Primitivas shadcn/ui en `src/ui/*` + 4 componentes `shared` (empty-state, error-state, loading-spinner, page-header) + hooks de UI |
| `packages/hooks` | `apiClient` (axios) + `TanstackProvider`. **Sin hooks de features.** |
| `packages/common` | Tipos, constantes y rutas del contrato (parcial, desalineado con los docs) |

Esto significa que el planning viejo (`doc/planning/sprints/sprint-00..11`) **ya no aplica tal cual**: asumía desarrollo paralelo back+front. Hoy la API es un hecho consumado; el frontend se construye contra un contrato existente. Este documento re-planifica el frontend sobre esa realidad.

---

## 2. Gaps encontrados (lo que hay que arreglar antes de construir)

### 2.1 Naming de paquetes inconsistente

- Los docs usan `@vir-ttend/*` (`@vir-ttend/ui`, `@vir-ttend/hooks`, `@vir-ttend/common`).
- El código real usa `@repo/*`, y **`apps/api` depende de `@repo/common`**.

**Decisión:** estandarizar toda la documentación en `@repo/*`. Renombrar paquetes rompería el backend (no es "frontend only").

### 2.2 `packages/hooks` — dos bugs reales

1. **Import por ruta relativa:** `src/lib/axios-client.ts` importa `../../../common/src/routes/auth.routes` en vez de `@repo/common`. Rompe el contrato de paquete (y fallaría con el build de tsup).
2. **Interceptor de refresh mal ubicado:** está en `interceptors.request` pero evalúa `error.response?.status === 401`. La lógica de refresh+retry debe vivir en `interceptors.response`. Hoy el refresh **nunca se ejecuta**.

### 2.3 Estructura de `packages/ui` desviada de la planificada

`doc/ui/DIRECTORY_STRUCTURE.md` planifica `components/{ui,layout,features,shared}`. La realidad es `src/ui/` (flat) + `src/components/shared/`. **Faltan `layout/` y `features/`**, que son el grueso del trabajo de UI.

### 2.4 `packages/common` desalineado con la API

- `student.routes.ts` (doc viejo: `students.routes.ts`).
- Faltan tipos de respuesta para: attendance (records, metrics, daily), alerts, dashboard, reports, announcements, auth (login response, tenant-option, user response).
- Faltan constantes útiles ya definidas en el backend: `attendance-status`, `shift`, `level`, `student-status`, `course-risk-status` (ya existen como enums) y rutas de tenants/users (no hay `tenant.routes.ts` ni `user.routes.ts`).

### 2.5 `apps/client` sin estructura

- Sin route groups `(auth)` / `(dashboard)`.
- Sin `middleware.ts` para proteger rutas por autenticación y por rol.
- Sin `AuthProvider` real, sin layouts de dashboard, sin navegación.
- Sin `src/stores` para estado global (selector de tenant, sesión).

### 2.6 No hay mapeo de vistas por rol

Ningún documento define qué ve cada rol. Se propone la matriz en la sección 5.

---

## 3. Principios rectores del frontend

1. **`apps/client` solo presenta páginas.** No fetchea, no tiene lógica de negocio. Todo componente → `@repo/ui`, todo fetching → `@repo/hooks`, todo contrato → `@repo/common`.
2. **`@repo/hooks` es el único lugar donde ocurre fetching** (axios + TanStack Query). Nunca se importa axios fuera del paquete.
3. **`@repo/common` es la fuente de verdad del contrato** (rutas + tipos + constantes). Si cambia un endpoint, TypeScript avisa en todos los consumidores.
4. **`@repo/ui` no fetchea directamente:** consume hooks de `@repo/hooks`. Solo los feature-components agregan lógica de composición.
5. **Rol y tenant guían la navegación:** el menú y las rutas se derivan de `user.role` y del tenant seleccionado (matriz sección 5).
6. **Una página por feature por rol**, con server components ligeros y client components para lo interactivo.
7. **Todo estado de servidor vive en TanStack Query** con query keys tipadas y predecibles.
8. **Validación con Zod** en `@repo/common` (schemas) reutilizada por hooks y forms.

---

## 4. Reestructuración propuesta (frontend only)

### 4.1 `packages/ui` — estructura target

```
packages/ui/src/
├── ui/                           # primitives shadcn (mantener flat; migración a components/ui es deuda opcional)
├── components/
│   ├── shared/                   # (ya existe) empty-state, error-state, loading-spinner, page-header
│   │                             # + data-table (TanStack Table) en este sprint base
│   ├── layout/                   # (NUEVO) app-shell por rol
│   │   ├── app-sidebar.tsx       #    navegación derivada del rol
│   │   ├── topbar.tsx            #    header con alert-badge + user menu
│   │   ├── dashboard-layout.tsx  #    composición sidebar + topbar + <main>
│   │   └── tenant-switcher.tsx   #    selector de tenant (post-login y header)
│   └── features/                 # (NUEVO) por dominio, espejo del backend
│       ├── auth/                 #   login-form, tenant-selector, password-input, auth-layout
│       ├── academic/             #   academic-year, course, subject, schedule
│       ├── students/             #   students-table, student-form, student-detail, enrollment-modal
│       ├── attendance/           #   attendance-grid, toolbar, metrics, justification-modal, subject-grid
│       ├── dashboard/            #   preceptor-dashboard, course-status-card, metrics, trend-chart
│       ├── alerts/               #   alerts-list, alert-badge, alert-type-badge
│       ├── reports/              #   monthly-report-table, student-report, export-actions, charts
│       ├── announcements/        #   list, card, form, target-selector, detail
│       ├── admin/                #   tenants-table, tenant-form, users-table, user-form, role-select
│       └── settings/             #   profile-form, school-settings
├── hooks/                        # (ya existe) use-toast, use-media-query, use-mobile
├── lib/                          # utils.ts (cn), format.ts (fechas/porcentajes)
└── index.ts                      # re-export centralizado (barrels por feature)
```

### 4.2 `packages/hooks` — estructura target

```
packages/hooks/src/
├── lib/
│   └── axios-client.ts           # FIX: import de @repo/common + interceptor.response de refresh
├── providers/
│   └── tanstack-provider.tsx     # QueryClient configurado (staleTime, retry, refetch)
├── keys.ts                       # factory de query keys tipadas (['students','list',{courseId}])
└── features/                     # espejo del backend (antes: src/<feature> flat)
    ├── auth/        use-login, use-select-tenant, use-logout, use-current-user
    ├── tenants/     use-tenants, use-create-tenant, use-update-tenant, use-toggle-tenant-status
    ├── users/       use-users, use-change-role
    ├── academic/    use-academic-years, use-courses, use-course, use-create-course,
    │                use-update-course, use-subjects, use-create-subject, use-schedule
    ├── students/    use-students, use-student, use-search-students, use-create-student,
    │                use-update-student, use-delete-student, use-enroll-student, use-transfer-student
    ├── attendance/  use-daily-attendance, use-register-daily-attendance, use-bulk-attendance,
    │                use-subject-attendance, use-register-subject-attendance, use-copy-attendance,
    │                use-teacher-subjects, use-justify-attendance, use-attendance-history
    ├── dashboard/   use-preceptor-dashboard, use-course-overview, use-dashboard-metrics
    ├── alerts/      use-alerts, use-unseen-alerts, use-alerts-count, use-mark-alert-seen, use-student-alerts
    ├── reports/     use-monthly-report, use-generate-report, use-course-summary,
    │                use-available-reports, use-student-report, use-export-excel, use-export-pdf
    └── announcements/ use-announcements, use-my-announcements, use-create-announcement,
                     use-update-announcement, use-publish-announcement, use-delete-announcement
```

### 4.3 `packages/common` — completar contrato

- **Nuevos tipos de respuesta** para: `auth` (LoginResponse, TenantOption, UserResponse, CurrentUser), `attendance` (AttendanceRecordResponse, DailyAttendanceResponse, AttendanceMetrics), `alerts` (AlertResponse, AlertsCount), `dashboard` (CourseSnapshot, PreceptorDashboard, DashboardMetrics), `reports` (MonthlyReport, StudentReport, CourseSummary), `announcements` (AnnouncementResponse), `tenants` (TenantResponse).
- **Nuevas rutas:** `tenant.routes.ts`, `user.routes.ts`, `announcement.routes.ts`, `dashboard.routes.ts`.
- **Schemas Zod** para forms (login, student, course, subject, announcement, attendance-status).
- Mantener todo re-exportado desde `src/index.ts`.

### 4.4 `apps/client` — estructura target

```
apps/client/src/
├── app/
│   ├── (auth)/                    # sin layout de dashboard
│   │   ├── layout.tsx             # AuthLayout (logo + card centrado)
│   │   ├── login/page.tsx
│   │   └── select-tenant/page.tsx
│   ├── (dashboard)/               # layout con AppShell según rol
│   │   ├── layout.tsx             # guard de rol + AppShell + AlertsCount polling
│   │   ├── page.tsx               # home según rol (redirige al primer módulo)
│   │   ├── students/{page,[id]/page,create/page}
│   │   ├── courses/{page,[id]/page,create/page}
│   │   ├── attendance/{page,daily/page,subject/page}
│   │   ├── alerts/page.tsx
│   │   ├── reports/{page,monthly/page,student/[id]/page,course/[id]/page}
│   │   ├── announcements/{page,create/page,[id]/page,[id]/edit/page}
│   │   ├── tenants/page.tsx        # superadmin
│   │   ├── users/page.tsx          # admin / superadmin
│   │   └── settings/{page,profile/page}
│   ├── layout.tsx                 # TanstackProvider + Toaster + AuthProvider
│   ├── loading.tsx / error.tsx / not-found.tsx
│   └── globals.css
├── lib/
│   ├── auth/provider.tsx          # AuthContext real (user, tenant, isAuthenticated)
│   └── auth/guards.ts             # helpers por rol (requireRole, isAllowed)
├── middleware.ts                  # protección server-side por rol
└── stores/                        # tenant-store (selector actual), ui-store (sidebar)
```

---

## 5. Mapa de vistas por rol

El acceso por rol se aplica en **tres capas**: `middleware.ts` (ruta), `(dashboard)/layout.tsx` (guards) y el `AppShell` (qué items se renderizan en el menú). `tenantId` y `role` vienen del JWT en cookie (leído via `GET /users/me`).

| Área | Ruta | `SUPERADMIN` | `ADMIN` | `PRECEPTOR` | `TEACHER` |
|---|---|---|---|---|---|
| Login / select tenant | `/login`, `/select-tenant` | ✅ (directo) | ✅ | ✅ | ✅ |
| Home | `/dashboard` | → tenants | → dashboard admin | → panel preceptor | → mis materias |
| Tenants (CRUD) | `/tenants` | ✅ | ❌ | ❌ | ❌ |
| Usuarios del tenant | `/users` | ✅ | ✅ | ❌ | ❌ |
| Años académicos | `/settings/academic` | ❌ | ✅ | ❌ | ❌ |
| Cursos | `/courses`, `/courses/[id]` | ❌ | ✅ (todos) | ✅ (asignados) | ❌ |
| Materias / horario | `/courses/[id]` | ❌ | ✅ | ✅ | ✅ (sus materias) |
| Estudiantes | `/students` | ❌ | ✅ | ✅ | ❌ (vía curso) |
| Asistencia diaria | `/attendance/daily` | ❌ | ✅ | ✅ | ❌ |
| Asistencia por materia | `/attendance/subject` | ❌ | ✅ | ✅ (lectura) | ✅ (registra) |
| Panel preceptoría | `/dashboard` | ❌ | ✅ | ✅ | ❌ |
| Alertas | `/alerts` | ❌ | ✅ | ✅ (sus cursos) | ❌ |
| Reportes | `/reports/*` | ❌ | ✅ | ✅ (sus cursos) | ❌ (vía admin) |
| Comunicados | `/announcements/*` | ❌ | ✅ (CRUD) | ✅ (crear/ver) | ✅ (ver `for-me`) |
| Perfil | `/settings/profile` | ✅ | ✅ | ✅ | ✅ |

**Principios del mapa:**
- El menú se construye por rol y **no se renderizan items sin permiso** (menú = única fuente).
- El `middleware` protege la ruta; el guard del layout da error 403 con navegación de vuelta.
- `PRECEPTOR` ve solo sus cursos (`preceptorId` del JWT); `TEACHER` solo sus materias (`/attendance/teacher/subjects`).
- `SUPERADMIN` hace login directo (sin selector de tenant) y vive en un área de gestión global.

---

## 6. Flujo de datos

```
Página (Server Component)  apps/client/src/app/...
        │ importa
        ▼
Feature Component (Client)  @repo/ui → components/features/<dominio>
        │ usa
        ▼
Hook TanStack Query        @repo/hooks → features/<dominio>
        │ llama
        ▼
apiClient (axios)          @repo/hooks → lib/axios-client.ts  (cookies httpOnly)
        │ pide
        ▼
NestJS API                 apps/api  (/docs → OpenAPI)
```

---

## 7. Convenciones

| Concepto | Regla |
|---|---|
| Página | `page.tsx` en `apps/client`, solo importa un componente de `@repo/ui` |
| Feature component | `<Name>Page.tsx` / `<Name>Form.tsx` / `<Name>Grid.tsx` en `packages/ui/src/components/features/<domain>/` |
| Barrels | cada feature folder tiene `index.ts` re-exportando sus componentes |
| Query hook | `use<Recurso>.ts` → `useStudents.ts` |
| Mutation hook | `use<Acción><Recurso>.ts` → `useCreateStudent.ts` |
| Query keys | factory tipada en `packages/hooks/src/keys.ts` (`['attendance','daily',{courseId,date}]`) |
| Validación | Zod schemas en `@repo/common`, resueltos con `@hookform/resolvers` |
| Roles | siempre desde `@repo/common` (`ROLES`), nunca strings sueltos |
| Rutas | siempre desde `@repo/common/routes`, nunca hardcodeadas |
| Fechas | `date-fns` (ya en `@repo/ui`) |
| Estado global | solo sesión/tenant (AuthContext + stores ligeras); el resto es server state |

---

## 8. Roadmap de sprints

| Sprint | Nombre | Objetivo | Horas | Depende |
|---|---|---|---|---|
| 00 | Foundation | Contrato common completo, fix de hooks, shell del App Router, tooling frontend | 40 | — |
| 01 | Auth & Sesión | Login 2 pasos, selector de tenant, sesión persistente, guards y middleware | 30 | 00 |
| 02 | App Shell & Navegación | Dashboard layout por rol, sidebar/topbar, responsive, home por rol | 30 | 01 |
| 03 | Estudiantes | Listado, filtros, CRUD, detalle, matriculación y transferencia | 30 | 02 |
| 04 | Académico | Años lectivos, cursos, materias, grilla de horarios | 35 | 02 |
| 05 | Asistencia Diaria | Panel preceptor primaria: grilla, quick actions, justificación, métricas | 35 | 03, 04 |
| 06 | Asistencia por Materia | Panel docente secundaria: grilla por materia, copiar clase, tardanzas | 30 | 03, 04 |
| 07 | Panel Preceptor + Alertas | Dashboard con semáforo, auto-refresh, alertas, badge | 30 | 05, 06 |
| 08 | Reportes & Export | Reporte mensual, reporte de alumno, charts, export Excel/PDF | 30 | 07 |
| 09 | Comunicados | Lista, creación con targeting, detalle, for-me | 25 | 02 |
| 10 | Admin & Settings | Tenants (superadmin), usuarios/memberships (admin), perfil | 30 | 02 |
| 11 | Polish, Tests & Deploy | Loading/empty/error, responsive, tests, performance, build | 35 | 03–10 |

**Total estimado: ~370 h** (~12 semanas a tiempo completo).

---

## 9. Reglas que nunca se rompen

- `apps/client` **no importa** axios ni `@tanstack/react-query` directamente.
- `@repo/common` no importa de nadie (cero dependencias de runtime).
- `@repo/hooks` solo importa de `@repo/common`.
- `@repo/ui` importa de `@repo/common` y `@repo/hooks` (nunca axios).
- Ninguna URL de API hardcodeada fuera de `@repo/common/routes`.
- Ningún rol hardcodeado fuera de `@repo/common/constants`.
- Todo fetch pasa por un hook de `@repo/hooks` (nunca `fetch`/`axios` inline en componentes).
- Las páginas de `apps/client` no contienen lógica de negocio.

---

**Siguiente paso →** [Sprint 00 — Foundation](./sprints/sprint-00-foundation.md)
