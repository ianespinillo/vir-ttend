# Sprint 07: Panel de Preceptoría

**Objetivo:** Dashboard consolidado para preceptores  
**Duración:** 1 semana  
**Estimación:** 25 horas  
**Depende de:** Sprint 05 y 06 (Attendance Daily y Subject)

---

## Objetivo

Implementar el panel de preceptoría con vista consolidada de todos los cursos, métricas en tiempo real y navegación rápida.

---

## Estimación

| Área | Horas |
|------|-------|
| Domain Layer | 2 |
| Application Layer | 6 |
| Infrastructure Layer | 2 |
| Presentation Layer | 3 |
| Frontend | 12 |
| **Total** | **25** |

---

## Backend

### Domain Layer

**Módulo:** `modules/attendance`

**Archivos a crear/actualizar:**

```
modules/attendance/
├── domain/
│   ├── services/
│   │   └── dashboard.service.ts    # NUEVO
│   └── domain/
│       └── attendance.types.ts    # Actualizar con tipos de dashboard
```

### Application Layer

**Módulo:** `modules/attendance/application`

**Archivos a crear:**

```
modules/attendance/
├── application/
│   ├── queries/
│   │   ├── get-dashboard/
│   │   │   ├── get-dashboard.query.ts
│   │   │   └── get-dashboard.handler.ts
│   │   ├── get-dashboard-metrics/
│   │   │   ├── get-dashboard-metrics.query.ts
│   │   │   └── get-dashboard-metrics.handler.ts
│   │   └── get-courses-overview/
│   │       ├── get-courses-overview.query.ts
│   │       └── get-courses-overview.handler.ts
│   └── dtos/
│       ├── dashboard.response.dto.ts
│       └── dashboard-metrics.response.dto.ts
│   └── attendance.module.ts   # Actualizar
```

### Infrastructure Layer

**Módulo:** `modules/attendance/infrastructure`

**Archivos a crear/actualizar:**

```
modules/attendance/
├── infrastructure/
│   └── persistence/
│       └── repositories/
│           └── attendance-record.repository.ts   # Actualizar con queries de dashboard
```

### Presentation Layer

**Módulo:** `modules/attendance/presentation`

**Archivos a crear/actualizar:**

```
modules/attendance/
└── presentation/
    ├── controllers/
    │   └── dashboard.controller.ts   # NUEVO
    └── attendance.presentation.module.ts   # Actualizar
```

**Endpoints:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /attendance/dashboard | Dashboard consolidado |
| GET | /attendance/dashboard/metrics | Métricas generales |
| GET | /attendance/dashboard/courses | Vista por cursos |

---

## Frontend

### Pages

**Archivos a crear:**

```
src/app/
├── (dashboard)/
│   └── dashboard/
│       ├── page.tsx              # /dashboard
│       └── components/
│           ├── dashboard-page.tsx
│           ├── dashboard-header.tsx
│           ├── courses-overview.tsx
│           ├── dashboard-metrics.tsx
│           └── recent-alerts.tsx
```

### Components

**Archivos a crear:**

```
src/components/
├── features/
│   ├── dashboard/
│   │   ├── dashboard-metrics/
│   │   │   ├── dashboard-metrics.tsx
│   │   │   ├── metric-card.tsx
│   │   │   └── index.ts
│   │   ├── courses-overview/
│   │   │   ├── courses-overview.tsx
│   │   │   ├── course-status-card.tsx
│   │   │   └── index.ts
│   │   └── recent-alerts/
│   │       ├── recent-alerts.tsx
│   │       └── index.ts
```

### Hooks

**Archivos a crear:**

```
packages/hooks/
├── src/
│   ├── attendance/
│   │   ├── use-dashboard.ts
│   │   ├── use-dashboard-metrics.ts
│   │   └── use-courses-overview.ts
│   └── index.ts   # Actualizar
```

---

## Testing

**Archivos a crear:**

```
apps/api/
├── test/
│   └── unit/
│       └── attendance/
│           └── dashboard.service.spec.ts
```

---

## Tareas por Día

### Día 1: Domain + Application Layer

- [ ] Crear DashboardService
- [ ] Crear GetDashboardQuery
- [ ] Crear DTOs de respuesta

### Día 2: Infrastructure + Presentation Layer

- [ ] Actualizar AttendanceRecordRepository
- [ ] Crear DashboardController
- [ ] Probar con Postman

### Día 3-4: Frontend

- [ ] Crear página /dashboard
- [ ] Crear DashboardMetrics
- [ ] Crear CoursesOverview
- [ ] Crear indicadores visuales (verde/amarillo/rojo)

### Día 5: Integración

- [ ] Test del dashboard
- [ ] Verificar métricas
- [ ] Auto-refresh (polling básico)

---

## Criterios de Aceptación

- [ ] Preceptor ve todos sus cursos en una vista
- [ ] Dashboard muestra métricas del día
- [ ] Indicadores visuales claros (verde/amarillo/rojo)
- [ ] Navegación rápida a registro de curso
- [ ] Auto-refresh funciona

---

## Siguiente Sprint

- Sprint 08: Alertas Automáticas
