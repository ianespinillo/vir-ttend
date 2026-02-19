# Estructura de Directorios - UI (Frontend)

**Proyecto:** Vir-ttend  
**Tipo:** Next.js 15 App Router + shadcn/ui + TanStack Query  
**Versión:** 1.0 MVP

---

## 1. Estructura General del Frontend

```
vir-ttend/
├── apps/
│   ├── client/                  # Next.js Frontend (solo presenta/páginas)
│   │   ├── public/
│   │   ├── src/
│   │   │   └── app/             # Next.js App Router (Páginas)
│   │   ├── package.json
│   │   ├── next.config.mjs
│   │   ├── tailwind.config.ts
│   │   └── tsconfig.json
│   └── api/                     # NestJS Backend
│
└── packages/
    ├── ui/                      # Componentes React (UI Kit)
    ├── common/                  # DTOs, tipos, constantes
    └── hooks/                   # TanStack Query hooks
```

---

## 2. Estructura del App Router (Next.js 15)

**Nota:** Las páginas en `apps/client/src/app` solo presentan componentes. Toda la lógica de UI está en `packages/ui`.

```
apps/client/src/app/
├── (auth)/                     # Route Group: Auth (sin layout)
│   ├── login/
│   │   └── page.tsx          # @vir-ttend/ui LoginPage
│   ├── register/
│   │   └── page.tsx         # @vir-ttend/ui RegisterPage
│   └── layout.tsx
│
├── (dashboard)/                # Route Group: Dashboard
│   ├── layout.tsx
│   ├── page.tsx              # @vir-ttend/ui DashboardHome
│   ├── students/
│   │   ├── page.tsx          # @vir-ttend/ui StudentsListPage
│   │   └── [id]/
│   │       └── page.tsx      # @vir-ttend/ui StudentDetailPage
│   ├── attendance/
│   │   ├── page.tsx          # @vir-ttend/ui AttendancePanelPage
│   │   ├── daily/
│   │   │   └── page.tsx     # @vir-ttend/ui DailyAttendancePage
│   │   └── subject/
│   │       └── page.tsx      # @vir-ttend/ui SubjectAttendancePage
│   ├── courses/
│   │   ├── page.tsx          # @vir-ttend/ui CoursesListPage
│   │   └── [id]/
│   │       └── page.tsx      # @vir-ttend/ui CourseDetailPage
│   ├── reports/
│   │   ├── page.tsx          # @vir-ttend/ui ReportsDashboardPage
│   │   ├── monthly/
│   │   │   └── page.tsx      # @vir-ttend/ui MonthlyReportPage
│   │   └── student/
│   │       └── page.tsx      # @vir-ttend/ui StudentReportPage
│   ├── announcements/
│   │   ├── page.tsx          # @vir-ttend/ui AnnouncementsListPage
│   │   ├── [id]/
│   │   │   └── page.tsx      # @vir-ttend/ui AnnouncementDetailPage
│   │   └── create/
│   │       └── page.tsx      # @vir-ttend/ui CreateAnnouncementPage
│   └── settings/
│       ├── page.tsx          # @vir-ttend/ui SettingsPage
│       └── profile/
│           └── page.tsx      # @vir-ttend/ui ProfileSettingsPage
│
├── api/
│   └── health/
│       └── route.ts
│
├── layout.tsx
├── loading.tsx
├── error.tsx
├── not-found.tsx
└── globals.css
```

---

## 3. Estructura de Componentes (packages/ui)

**IMPORTANTE:** Todos los componentes van en `packages/ui/src/components`. `apps/client` solo consume estos componentes.

### 3.1 Organización por features

```
packages/ui/src/
├── components/
│   ├── ui/                        # Componentes base (shadcn/ui)
│   │   ├── button/
│   │   ├── input/
│   │   ├── card/
│   │   ├── table/
│   │   ├── dialog/
│   │   ├── form/
│   │   ├── dropdown-menu/
│   │   └── ...
│   │
│   ├── layout/                    # Componentes de layout
│   │   ├── sidebar/
│   │   │   ├── sidebar.tsx
│   │   │   ├── sidebar-item.tsx
│   │   │   ├── sidebar-group.tsx
│   │   │   └── index.ts
│   │   ├── header/
│   │   │   ├── header.tsx
│   │   │   ├── header-user-menu.tsx
│   │   │   └── index.ts
│   │   ├── footer/
│   │   │   └── footer.tsx
│   │   └── responsive-wrapper/
│   │       └── responsive-wrapper.tsx
│   │
│   ├── features/                  # Componentes por feature (domain-driven)
│   │   ├── auth/
│   │   │   ├── login-form.tsx
│   │   │   ├── register-form.tsx
│   │   │   └── password-input.tsx
│   │   │
│   │   ├── attendance/
│   │   │   ├── attendance-grid/
│   │   │   │   ├── attendance-grid.tsx
│   │   │   │   ├── attendance-row.tsx
│   │   │   │   ├── attendance-cell.tsx
│   │   │   │   └── index.ts
│   │   │   ├── attendance-toolbar/
│   │   │   │   ├── attendance-toolbar.tsx
│   │   │   │   ├── date-picker.tsx
│   │   │   │   ├── course-selector.tsx
│   │   │   │   └── index.ts
│   │   │   ├── attendance-summary/
│   │   │   │   ├── attendance-summary.tsx
│   │   │   │   ├── metrics-card.tsx
│   │   │   │   └── index.ts
│   │   │   ├── attendance-form/
│   │   │   │   ├── attendance-form.tsx
│   │   │   │   └── status-select.tsx
│   │   │   └── alert-badge/
│   │   │       ├── alert-badge.tsx
│   │   │       └── index.ts
│   │   │
│   │   ├── students/
│   │   │   ├── students-table/
│   │   │   │   ├── students-table.tsx
│   │   │   │   ├── student-row.tsx
│   │   │   │   └── index.ts
│   │   │   ├── student-card/
│   │   │   │   ├── student-card.tsx
│   │   │   │   └── index.ts
│   │   │   ├── student-filters/
│   │   │   │   ├── student-filters.tsx
│   │   │   │   └── index.ts
│   │   │   └── student-form/
│   │   │       ├── student-form.tsx
│   │   │       └── index.ts
│   │   │
│   │   ├── courses/
│   │   │   ├── courses-list/
│   │   │   ├── course-card/
│   │   │   └── course-form/
│   │   │
│   │   ├── reports/
│   │   │   ├── report-export/
│   │   │   ├── monthly-report/
│   │   │   ├── student-history/
│   │   │   └── chart/
│   │   │       ├── attendance-chart.tsx
│   │   │       └── index.ts
│   │   │
│   │   └── announcements/
│   │       ├── announcements-list/
│   │       ├── announcement-card/
│   │       └── announcement-form/
│   │
│   └── shared/                    # Componentes reutilizables
│       ├── data-table/
│       │   ├── data-table.tsx
│       │   ├── data-table-column-header.tsx
│       │   ├── data-table-pagination.tsx
│       │   ├── data-table-row-actions.tsx
│       │   └── index.ts
│       ├── page-header/
│       │   ├── page-header.tsx
│       │   └── index.ts
│       ├── empty-state/
│       │   ├── empty-state.tsx
│       │   └── index.ts
│       ├── loading-spinner/
│       │   ├── loading-spinner.tsx
│       │   └── index.ts
│       └── confirmation-dialog/
│           ├── confirmation-dialog.tsx
│           └── index.ts
│
├── lib/
│   ├── utils/
│   │   ├── cn.ts
│   │   ├── date.ts
│   │   └── format.ts
│   │
│   └── config/
│       └── site-config.ts
│
├── hooks/
│   ├── use-toast.ts
│   └── use-media-query.ts
│
├── styles/
│   └── globals.css
│
└── index.ts                      # Export centralizado
```

---

## 4. Estructura de hooks (packages/hooks)

**Nota:** Los hooks de TanStack Query están en `packages/hooks`. El API client va incluido para que los hooks puedan hacer requests.

```
packages/hooks/
├── src/
│   ├── api/
│   │   ├── client.ts              # Axios/Fetch client configurado
│   │   ├── endpoints.ts           # Definición de endpoints
│   │   └── interceptors/
│   │       ├── auth.interceptor.ts
│   │       └── error.interceptor.ts
│   │
│   ├── index.ts
│   │
│   ├── auth/
│   │   ├── use-login.ts
│   │   ├── use-logout.ts
│   │   ├── use-refresh-token.ts
│   │   └── use-current-user.ts
│   │
│   ├── attendance/
│   │   ├── use-daily-attendance.ts
│   │   ├── use-subject-attendance.ts
│   │   ├── use-register-attendance.ts
│   │   ├── use-justify-attendance.ts
│   │   ├── use-attendance-metrics.ts
│   │   └── use-attendance-alerts.ts
│   │
│   ├── students/
│   │   ├── use-students.ts
│   │   ├── use-student.ts
│   │   ├── use-create-student.ts
│   │   ├── use-update-student.ts
│   │   └── use-delete-student.ts
│   │
│   ├── courses/
│   │   ├── use-courses.ts
│   │   ├── use-course.ts
│   │   └── use-course-students.ts
│   │
│   ├── subjects/
│   │   ├── use-subjects.ts
│   │   └── use-subject-schedule.ts
│   │
│   ├── reports/
│   │   ├── use-monthly-report.ts
│   │   ├── use-student-history.ts
│   │   └── use-export-report.ts
│   │
│   └── announcements/
│       ├── use-announcements.ts
│       ├── use-create-announcement.ts
│       └── use-mark-announcement-read.ts
│
├── package.json
└── tsconfig.json
```

### 4.2 Estructura de un Custom Hook

```typescript
// packages/hooks/src/attendance/use-daily-attendance.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@vir-ttend/hooks';
import { AttendanceRecord, DailyAttendanceParams } from '@vir-ttend/common';

interface UseDailyAttendanceOptions {
  courseId: string;
  date: string;
  enabled?: boolean;
}

export function useDailyAttendance({ courseId, date, enabled = true }: UseDailyAttendanceOptions) {
  return useQuery({
    queryKey: ['attendance', 'daily', courseId, date],
    queryFn: () => api.attendance.getDaily({ courseId, date }),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

---

## 4. Estructura de Site Config y Tipos (packages/common)

```
packages/common/
├── src/
│   ├── index.ts
│   │
│   ├── config/
│   │   └── site.config.ts      # Configuración global del sitio
│   │
│   ├── types/
│   │   ├── user.types.ts
│   │   ├── student.types.ts
│   │   ├── course.types.ts
│   │   ├── attendance.types.ts
│   │   └── announcement.types.ts
│   │
│   ├── dto/
│   │   ├── auth/
│   │   │   ├── login.dto.ts
│   │   │   └── refresh-token.dto.ts
│   │   ├── attendance/
│   │   │   ├── register-attendance.dto.ts
│   │   │   └── attendance-response.dto.ts
│   │   ├── students/
│   │   │   ├── create-student.dto.ts
│   │   │   └── update-student.dto.ts
│   │   └── ...
│   │
│   ├── schemas/               # Zod schemas
│   │   ├── auth.schema.ts
│   │   ├── attendance.schema.ts
│   │   └── student.schema.ts
│   │
│   ├── constants/
│   │   ├── roles.ts
│   │   ├── attendance-status.ts
│   │   └── routes.ts
│   │
│   └── utils/
│       ├── date.utils.ts
│       └── string.utils.ts
│
├── package.json
└── tsconfig.json
```

---

## 5. Estructura de Client App (apps/client)

```
apps/client/src/
├── app/                       # Next.js App Router (páginas)
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   └── (dashboard)/
│       └── ...
│
├── stores/                    # Estado global (Zustand/Jotai)
│   ├── auth-store.ts
│   ├── sidebar-store.ts
│   └── notification-store.ts
│
└── lib/
    └── cn.ts                  # Re-export de @vir-ttend/ui
```

## 6. Convenciones de Nombrado

### 6.1 Componentes

| Tipo | Patrón | Ubicación |
|------|--------|-----------|
| Componente de página | `<Name>Page.tsx` | `packages/ui/src/components/features/...` |
| Componente de UI | `<Name>.tsx` | `packages/ui/src/components/ui/...` |
| Componente de feature | `<Feature><Component>.tsx` | `packages/ui/src/components/features/...` |
| Componente de layout | `<Layout><Name>.tsx` | `packages/ui/src/components/layout/...` |
| Componente de formulario | `<Name>Form.tsx` | `packages/ui/src/components/features/...` |
| Componente de tabla | `<Name>Table.tsx` | `packages/ui/src/components/features/...` |
| Página (apps/client) | `page.tsx` | `apps/client/src/app/...` |

### 6.2 Hooks

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Query hook | `use<Resource>.ts` | `useStudents.ts` |
| Mutation hook | `use<Action><Resource>.ts` | `useCreateStudent.ts` |
| Custom hook | `use<Function>.ts` | `useMediaQuery.ts` |

### 6.3 Archivos de barrel

```typescript
// components/attendance/attendance-grid/index.ts
export { AttendanceGrid } from './attendance-grid';
export { AttendanceRow } from './attendance-row';
export { AttendanceCell } from './attendance-cell';
```

---

## 10. Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                    APPS/CLIENT (PAGE)                            │
│                    page.tsx + loading.tsx + error.tsx           │
└─────────────────────────────┬───────────────────────────────────┘
                              │ (importa)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PACKAGES/UI (COMPONENTS)                     │
│              <Feature>Page / <Feature>Grid / <Feature>Form      │
└─────────────────────────────┬───────────────────────────────────┘
                              │ (usa)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PACKAGES/HOOKS (TANSTACK QUERY)              │
│              useStudents() / useRegisterAttendance()             │
│                    (Server State + Caching)                      │
└─────────────────────────────┬───────────────────────────────────┘
                              │ (llama)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPS/CLIENT (API CLIENT)                     │
│                  api.client.ts + interceptors                    │
└─────────────────────────────┬───────────────────────────────────┘
                              │ (pide)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPS/API (NESTJS BACKEND)                    │
│                         /api/attendance                           │
└─────────────────────────────────────────────────────────────────┘
```
┌─────────────────────────────────────────────────────────────────┐
│                         PAGE (React Server Component)           │
│                  page.tsx + loading.tsx + error.tsx             │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENT (Client Component)                  │
│              <Feature>Page / <Feature>Grid / <Feature>Form      │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TANSTACK QUERY HOOK                         │
│              useStudents() / useRegisterAttendance()             │
│                    (Server State + Caching)                      │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API CLIENT (axios/fetch)                     │
│                  api.client.ts + interceptors                    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NESTJS API (Backend)                         │
│                         /api/attendance                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Patrones de Componentes

### 8.1 Ejemplo: Componente en packages/ui

```typescript
// packages/ui/src/components/features/attendance/attendance-grid/attendance-grid.tsx
'use client';

import { useDailyAttendance } from '@vir-ttend/hooks';
import { AttendanceGrid } from './attendance-grid';
import { AttendanceSummary } from '../attendance-summary';

interface AttendancePanelProps {
  courseId: string;
  date: string;
}

export function AttendancePanel({ courseId, date }: AttendancePanelProps) {
  const { data, isLoading, error } = useDailyAttendance({ courseId, date });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="space-y-4">
      <AttendanceSummary records={data.records} />
      <AttendanceGrid records={data.records} />
    </div>
  );
}
```

### 8.2 Ejemplo: Página en apps/client (solo presenta)

```typescript
// apps/client/src/app/attendance/page.tsx
import { AttendancePanel } from '@vir-ttend/ui';

export default function AttendancePage() {
  return <AttendancePanel />;
}
```

---

## 9. Estructura de testing

```
packages/ui/
├── src/
│   └── components/
│       └── ... (componentes)
├── __tests__/
│   ├── components/
│   │   ├── attendance-grid.spec.tsx
│   │   └── login-form.spec.tsx
│   ├── hooks/
│   │   └── use-media-query.spec.ts
│   └── mocks/
│       └── fixtures/
├── vitest.config.ts
└── package.json
```

---

## 10. Resumen de la Estructura

```
vir-ttend/
├── apps/
│   ├── client/                    # Next.js (solo presenta/páginas)
│   │   └── src/app/              # Páginas que importan de @vir-ttend/ui
│   └── api/                      # NestJS Backend
│
└── packages/
    ├── ui/                       # Componentes React (UI Kit)
    │   └── src/components/
    │       ├── ui/              # shadcn/ui base
    │       ├── layout/          # Layout components
    │       ├── features/        # Feature components
    │       └── shared/          # Shared components
    │
    ├── common/                  # Tipos, DTOs, constantes
    ├── hooks/                   # TanStack Query hooks
    └── ...
```

### Flujo de datos:

```
apps/client/src/app/page.tsx
    │
    ▼ (importa)
@vir-ttend/ui (componentes)
    │
    ▼ (usa)
@vir-ttend/hooks (TanStack Query)
    │
    ▼ (llama)
API Client (apps/client)
    │
    ▼ (pide)
apps/api (NestJS)
```

---

## 11. Rutas del Sistema

| Ruta | Componente (en @vir-ttend/ui) | Descripción |
|------|-------------------------------|-------------|
| `/login` | LoginPage | Autenticación |
| `/register` | RegisterPage | Registro |
| `/dashboard` | DashboardHome | Panel principal |
| `/attendance` | AttendancePanel | Panel de asistencia |
| `/attendance/daily` | DailyAttendance | Asistencia diaria (Primaria) |
| `/attendance/subject` | SubjectAttendance | Asistencia por materia |
| `/students` | StudentsList | Lista de estudiantes |
| `/students/[id]` | StudentDetail | Detalle de estudiante |
| `/courses` | CoursesList | Lista de cursos |
| `/courses/[id]` | CourseDetail | Detalle del curso |
| `/reports` | ReportsDashboard | Dashboard de reportes |
| `/reports/monthly` | MonthlyReport | Reporte mensual |
| `/reports/student/[id]` | StudentReport | Historial de estudiante |
| `/announcements` | AnnouncementsList | Lista de comunicados |
| `/announcements/create` | CreateAnnouncement | Crear comunicado |
| `/settings` | SettingsIndex | Configuración |
| `/settings/profile` | ProfileSettings | Perfil de usuario |

---

**Fin del documento**
