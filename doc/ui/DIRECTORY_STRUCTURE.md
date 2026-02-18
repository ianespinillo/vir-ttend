# Estructura de Directorios - UI (Frontend)

**Proyecto:** Vir-ttend  
**Tipo:** Next.js 15 App Router + shadcn/ui + TanStack Query  
**Versión:** 1.0 MVP

---

## 1. Estructura General del Frontend

```
apps/client/
├── public/                     # Archivos estáticos
│   ├── images/
│   ├── icons/
│   └── fonts/
├── src/
│   ├── app/                    # Next.js App Router (Pages/Routes)
│   ├── components/             # Componentes React
│   ├── lib/                    # Utilidades y configuraciones
│   ├── hooks/                 # Custom hooks (locales)
│   ├── stores/                # Estado global (Zustand/Jotai)
│   └── styles/               # Estilos globales
├── package.json
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## 2. Estructura del App Router (Next.js 15)

```
src/app/
├── (auth)/                     # Route Group: Auth (sin layout)
│   ├── login/
│   │   ├── page.tsx
│   │   └── components/
│   │       └── login-form.tsx
│   ├── register/
│   │   ├── page.tsx
│   │   └── components/
│   │       └── register-form.tsx
│   └── layout.tsx             # Minimal layout (solo loading/error)
│
├── (dashboard)/                # Route Group: Dashboard
│   ├── layout.tsx             # Dashboard layout (sidebar, header)
│   ├── page.tsx               # Dashboard home (/dashboard)
│   ├── students/
│   │   ├── page.tsx          # Lista de estudiantes
│   │   ├── [id]/
│   │   │   ├── page.tsx      # Detalle de estudiante
│   │   │   └── components/
│   │   │       └── student-profile.tsx
│   │   └── components/
│   │       ├── students-table.tsx
│   │       └── students-filters.tsx
│   ├── attendance/
│   │   ├── page.tsx          # Panel de asistencia (preceptor)
│   │   ├── daily/
│   │   │   ├── page.tsx      # Asistencia diaria (primaria)
│   │   │   └── components/
│   │   │       └── daily-attendance-grid.tsx
│   │   ├── subject/
│   │   │   ├── page.tsx      # Asistencia por materia (secundaria)
│   │   │   └── components/
│   │   │       └── subject-attendance-grid.tsx
│   │   └── components/
│   │       ├── attendance-toolbar.tsx
│   │       └── attendance-summary.tsx
│   ├── courses/
│   │   ├── page.tsx          # Lista de cursos
│   │   ├── [id]/
│   │   │   ├── page.tsx      # Detalle del curso
│   │   │   └── components/
│   │   │       ├── course-header.tsx
│   │   │       └── course-students.tsx
│   │   └── components/
│   │       └── courses-list.tsx
│   ├── reports/
│   │   ├── page.tsx          # Dashboard de reportes
│   │   ├── monthly/
│   │   │   ├── page.tsx      # Reporte mensual
│   │   │   └── components/
│   │   │       └── monthly-report.tsx
│   │   ├── student/
│   │   │   ├── page.tsx      # Historial de estudiante
│   │   │   └── components/
│   │   │       └── student-history.tsx
│   │   └── export/
│   │       ├── page.tsx      # Exportar reportes
│   │       └── components/
│   │           └── export-form.tsx
│   ├── announcements/
│   │   ├── page.tsx          # Lista de comunicados
│   │   ├── [id]/
│   │   │   └── page.tsx      # Detalle de comunicado
│   │   ├── create/
│   │   │   ├── page.tsx      # Crear comunicado
│   │   │   └── components/
│   │   │       └── announcement-form.tsx
│   │   └── components/
│   │       └── announcements-list.tsx
│   └── settings/
│       ├── page.tsx          # Configuración general
│       ├── profile/
│       │   ├── page.tsx      # Perfil de usuario
│       │   └── components/
│       │       └── profile-form.tsx
│       ├── school/
│       │   ├── page.tsx      # Configuración de escuela
│       │   └── components/
│       │       └── school-settings.tsx
│       └── components/
│           └── settings-nav.tsx
│
├── api/                        # API Routes (BFF si es necesario)
│   └── health/
│       └── route.ts
│
├── layout.tsx                 # Root layout
├── loading.tsx                # Root loading
├── error.tsx                 # Root error
├── not-found.tsx             # 404
└── globals.css               # Tailwind + variables CSS
```

---

## 3. Estructura de Componentes

### 3.1 Organización por features

```
src/components/
├── ui/                        # Componentes base (shadcn/ui)
│   ├── button/
│   ├── input/
│   ├── card/
│   ├── table/
│   ├── dialog/
│   ├── form/
│   ├── dropdown-menu/
│   └── ...
│
├── layout/                    # Componentes de layout
│   ├── sidebar/
│   │   ├── sidebar.tsx
│   │   ├── sidebar-item.tsx
│   │   ├── sidebar-group.tsx
│   │   └── index.ts
│   ├── header/
│   │   ├── header.tsx
│   │   ├── header-user-menu.tsx
│   │   └── index.ts
│   ├── footer/
│   │   └── footer.tsx
│   └── responsive-wrapper/
│       └── responsive-wrapper.tsx
│
├── features/                  # Componentes por feature (domain-driven)
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   └── password-input.tsx
│   │
│   ├── attendance/
│   │   ├── attendance-grid/
│   │   │   ├── attendance-grid.tsx
│   │   │   ├── attendance-row.tsx
│   │   │   ├── attendance-cell.tsx
│   │   │   └── index.ts
│   │   ├── attendance-toolbar/
│   │   │   ├── attendance-toolbar.tsx
│   │   │   ├── date-picker.tsx
│   │   │   ├── course-selector.tsx
│   │   │   └── index.ts
│   │   ├── attendance-summary/
│   │   │   ├── attendance-summary.tsx
│   │   │   ├── metrics-card.tsx
│   │   │   └── index.ts
│   │   ├── attendance-form/
│   │   │   ├── attendance-form.tsx
│   │   │   └── status-select.tsx
│   │   └── alert-badge/
│   │       ├── alert-badge.tsx
│   │       └── index.ts
│   │
│   ├── students/
│   │   ├── students-table/
│   │   │   ├── students-table.tsx
│   │   │   ├── student-row.tsx
│   │   │   └── index.ts
│   │   ├── student-card/
│   │   │   ├── student-card.tsx
│   │   │   └── index.ts
│   │   ├── student-filters/
│   │   │   ├── student-filters.tsx
│   │   │   └── index.ts
│   │   └── student-form/
│   │       ├── student-form.tsx
│   │       └── index.ts
│   │
│   ├── courses/
│   │   ├── courses-list/
│   │   ├── course-card/
│   │   └── course-form/
│   │
│   ├── reports/
│   │   ├── report-export/
│   │   ├── monthly-report/
│   │   ├── student-history/
│   │   └── chart/
│   │       ├── attendance-chart.tsx
│   │       └── index.ts
│   │
│   └── announcements/
│       ├── announcements-list/
│       ├── announcement-card/
│       └── announcement-form/
│
└── shared/                    # Componentes reutilizables
    ├── data-table/
    │   ├── data-table.tsx
    │   ├── data-table-column-header.tsx
    │   ├── data-table-pagination.tsx
    │   ├── data-table-row-actions.tsx
    │   └── index.ts
    ├── page-header/
    │   ├── page-header.tsx
    │   └── index.ts
    ├── empty-state/
    │   ├── empty-state.tsx
    │   └── index.ts
    ├── loading-spinner/
    │   ├── loading-spinner.tsx
    │   └── index.ts
    └── confirmation-dialog/
        ├── confirmation-dialog.tsx
        └── index.ts
```

---

## 4. Estructura de hooks y API

### 4.1 TanStack Query Hooks (packages/hooks)

```
packages/hooks/
├── src/
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

## 5. Estructura de tipos y DTOs (packages/common)

```
packages/common/
├── src/
│   ├── index.ts
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

## 6. Estructura de lib (utilidades)

```
src/lib/
├── api/
│   ├── client.ts              # Axios/Fetch client configurado
│   ├── endpoints.ts           # Definición de endpoints
│   └── interceptors/
│       ├── auth.interceptor.ts
│       └── error.interceptor.ts
│
├── auth/
│   ├── provider.tsx           # AuthProvider (React Context)
│   ├── utils.ts                # Funciones de auth
│   └── config.ts              # Config de auth
│
├── utils/
│   ├── cn.ts                  # classnames + tailwind merge
│   ├── date.ts                # Utilidades de fecha
│   ├── format.ts              # Formateo de datos
│   └── validation.ts          # Funciones de validación
│
├── validations/
│   ├── auth.validation.ts
│   ├── student.validation.ts
│   └── attendance.validation.ts
│
└── config/
    └── site-config.ts          # Configuración del sitio
```

---

## 7. Estructura de stores (Estado Global)

```
src/stores/
├── auth-store.ts              # Estado de autenticación
├── sidebar-store.ts           # Estado del sidebar
├── attendance-store.ts        # Estado temporal de asistencia
└── notification-store.ts     # Notificaciones/toasts
```

---

## 8. Estructura de UI Components (shadcn/ui)

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── ui/                # Componentes base shadcn
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   └── ...
│   │   │
│   │   └── index.ts          # Export centralizado
│   │
│   ├── lib/
│   │   ├── utils.ts           # Utils de shadcn
│   │   └── cn.ts              # classnames helper
│   │
│   ├── hooks/
│   │   ├── use-toast.ts
│   │   └── use-media-query.ts
│   │
│   ├── types/
│   │   └── index.d.ts
│   │
│   └── styles/
│       └── globals.css
│
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## 9. Convenciones de Nombrado

### 9.1 Componentes

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Componente de página | `page.tsx` | `attendance/page.tsx` |
| Componente de UI | `<Name>.tsx` | `Button.tsx` |
| Componente de feature | `<Feature><Component>.tsx` | `AttendanceGrid.tsx` |
| Componente de layout | `<Layout><Name>.tsx` | `Sidebar.tsx` |
| Componente de formulario | `<Name>Form.tsx` | `LoginForm.tsx` |
| Componente de tabla | `<Name>Table.tsx` | `StudentsTable.tsx` |

### 9.2 Hooks

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Query hook | `use<Resource>.ts` | `useStudents.ts` |
| Mutation hook | `use<Action><Resource>.ts` | `useCreateStudent.ts` |
| Custom hook | `use<Function>.ts` | `useMediaQuery.ts` |

### 9.3 Archivos de barrel

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

## 11. Patrones de Componentes

### 11.1 Feature Component con Hooks

```typescript
// src/components/features/attendance/attendance-grid/attendance-grid.tsx
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

### 11.2 Composable Component

```typescript
// src/components/shared/data-table/data-table.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from './data-table';

interface StudentsTableProps {
  data: Student[];
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}

const columns: ColumnDef<Student>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  // ...
];

export function StudentsTable({ data, onEdit, onDelete }: StudentsTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}
```

---

## 12. Estructura de testing

```
apps/client/
├── src/
│   └── ... (components, app, etc.)
├── __tests__/
│   ├── components/
│   │   ├── attendance-grid.spec.tsx
│   │   └── login-form.spec.tsx
│   ├── hooks/
│   │   └── use-students.spec.ts
│   ├── utils/
│   │   └── date.utils.spec.ts
│   └── mocks/
│       ├── handlers.ts       # MSW handlers
│       └── fixtures/
│           └── students.json
├── vitest.config.ts
└── package.json
```

---

## 13. Resumen Visual

```
apps/client/src/
├── app/                       # Next.js App Router
│   ├── (auth)/               # Auth routes
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/          # Protected routes
│   │   ├── attendance/
│   │   ├── students/
│   │   ├── courses/
│   │   ├── reports/
│   │   └── settings/
│   └── layout.tsx
│
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── layout/               # Layout components
│   ├── features/             # Feature components
│   │   ├── attendance/
│   │   ├── students/
│   │   ├── courses/
│   │   └── ...
│   └── shared/               # Shared components
│
├── lib/
│   ├── api/                  # API client
│   ├── auth/                 # Auth utilities
│   ├── utils/                # Helpers
│   └── validations/          # Zod schemas
│
├── hooks/                    # Custom hooks
├── stores/                   # Global state
└── styles/                   # Global styles
```

---

## 14. Rutas del Sistema

| Ruta | Componente | Descripción |
|------|------------|-------------|
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
