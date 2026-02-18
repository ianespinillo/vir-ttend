# Sprint 09: Reportes Mensuales

**Objetivo:** Generación de reportes mensuales y de estudiante  
**Duración:** 1 semana  
**Estimación:** 30 horas  
**Depende de:** Sprint 08 (Alerts)

---

## Objetivo

Implementar la generación de reportes mensuales por curso y reportes individuales de estudiante.

---

## Estimación

| Área | Horas |
|------|-------|
| Domain Layer | 4 |
| Application Layer | 8 |
| Infrastructure Layer | 4 |
| Presentation Layer | 4 |
| Frontend | 10 |
| **Total** | **30** |

---

## Backend

### Domain Layer

**Módulo:** `modules/reporting`

**Archivos a crear:**

```
modules/reporting/
├── domain/
│   ├── entities/
│   │   └── monthly-report.entity.ts   # NUEVO (reporte pre-calculado)
│   ├── value-objects/
│   │   ├── report-id.value-object.ts
│   │   └── report-period.value-object.ts
│   ├── services/
│   │   ├── report-generation.service.ts  # NUEVO
│   │   └── metrics-calculation.service.ts # NUEVO
│   └── repositories/
│       └── report.repository.interface.ts  # NUEVO
```

**Detalles:**

| Entidad | Campos |
|---------|--------|
| MonthlyReport | id, tenant_id, course_id, academic_year_id, month, year, data (JSON), created_at |

### Application Layer

**Módulo:** `modules/reporting/application`

**Archivos a crear:**

```
modules/reporting/
├── application/
│   ├── commands/
│   │   ├── generate-monthly-report/
│   │   │   ├── generate-monthly-report.command.ts
│   │   │   └── generate-monthly-report.handler.ts
│   │   └── generate-student-report/
│   │       ├── generate-student-report.command.ts
│   │       └── generate-student-report.handler.ts
│   ├── queries/
│   │   ├── get-monthly-report/
│   │   │   ├── get-monthly-report.query.ts
│   │   │   └── get-monthly-report.handler.ts
│   │   ├── get-student-report/
│   │   │   ├── get-student-report.query.ts
│   │   │   └── get-student-report.handler.ts
│   │   ├── get-reports-by-course/
│   │   │   └── get-reports-by-course.handler.ts
│   │   └── get-course-summary/
│   │       └── get-course-summary.handler.ts
│   ├── dtos/
│   │   ├── monthly-report.response.dto.ts
│   │   ├── student-report.response.dto.ts
│   │   └── course-summary.response.dto.ts
│   └── reporting.module.ts
```

### Infrastructure Layer

**Módulo:** `modules/reporting/infrastructure`

**Archivos a crear:**

```
modules/reporting/
├── infrastructure/
│   ├── persistence/
│   │   ├── repositories/
│   │   │   └── report.repository.ts  # NUEVO
│   │   └── reporting.persistence.module.ts
│   └── services/
│       └── report-generation.service.ts  # NUEVO
```

### Presentation Layer

**Módulo:** `modules/reporting/presentation`

**Archivos a crear:**

```
modules/reporting/
└── presentation/
    ├── controllers/
    │   ├── reports.controller.ts     # GET /reports/monthly
    │   └── student-reports.controller.ts  # GET /reports/student/:id
    └── reporting.presentation.module.ts
```

**Endpoints:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /reports/monthly?courseId=&month=&year= | Reporte mensual |
| GET | /reports/student/:id?from=&to= | Reporte de estudiante |
| GET | /reports/course/:id/summary | Resumen del curso |
| POST | /reports/generate | Generar reporte manualmente |

---

## Frontend

### Pages

**Archivos a crear:**

```
src/app/
├── (dashboard)/
│   └── reports/
│       ├── monthly/
│       │   ├── page.tsx           # /reports/monthly
│       │   └── components/
│       │       ├── monthly-report-page.tsx
│       │       ├── month-selector.tsx
│       │       └── report-table.tsx
│       ├── student/
│       │   ├── [id]/
│       │   │   └── page.tsx      # /reports/student/:id
│       │   └── components/
│       │       ├── student-report-page.tsx
│       │       └── attendance-chart.tsx
│       └── course/
│           └── [id]/
│               └── page.tsx      # /reports/course/:id
```

### Components

**Archivos a crear:**

```
src/components/
├── features/
│   └── reports/
│       ├── report-table/
│       │   ├── report-table.tsx
│       │   ├── report-row.tsx
│       │   └── index.ts
│       ├── month-selector/
│       │   ├── month-selector.tsx
│       │   └── index.ts
│       ├── attendance-chart/
│       │   ├── attendance-chart.tsx
│       │   └── index.ts
│       └── report-card/
│           ├── report-card.tsx
│           └── index.ts
```

### Hooks

**Archivos a crear:**

```
packages/hooks/
├── src/
│   ├── reports/
│   │   ├── use-monthly-report.ts
│   │   ├── use-student-report.ts
│   │   ├── use-course-summary.ts
│   │   └── use-generate-report.ts
│   └── index.ts   # Actualizar
```

---

## Testing

**Archivos a crear:**

```
apps/api/
├── test/
│   └── unit/
│       └── reporting/
│           ├── report-generation.service.spec.ts
│           └── metrics-calculation.service.spec.ts
```

---

## Tareas por Día

### Día 1: Domain Layer

- [ ] Crear MonthlyReport entity
- [ ] Crear ReportGenerationService
- [ ] Crear MetricsCalculationService

### Día 2: Application Layer

- [ ] Crear GetMonthlyReportQuery
- [ ] Crear GetStudentReportQuery
- [ ] Crear DTOs

### Día 3: Infrastructure Layer

- [ ] Implementar ReportRepository
- [ ] Implementar ReportGenerationService

### Día 4: Presentation Layer

- [ ] Crear ReportsController
- [ ] Crear StudentReportsController
- [ ] Probar con Postman

### Día 5-6: Frontend

- [ ] Crear página /reports/monthly
- [ ] Crear página /reports/student/:id
- [ ] Crear ReportTable
- [ ] Crear MonthSelector

### Día 7: Integración

- [ ] Test de generación de reportes
- [ ] Verificar cálculos

---

## Criterios de Aceptación

- [ ] Reporte mensual se genera correctamente
- [ ] Porcentajes son precisos
- [ ] Frontend muestra datos en tabla
- [ ] Filtros por mes/año funcionan

---

## Siguiente Sprint

- Sprint 10: Exportación
