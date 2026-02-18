# Sprint 05: Asistencia Diaria (Primaria)

**Objetivo:** Registro diario de asistencia para educación primaria  
**Duración:** 1 semana  
**Estimación:** 40 horas  
**Depende de:** Sprint 04 (Students)

---

## Objetivo

Implementar el sistema de registro diario de asistencia para educación primaria, incluyendo justificaciones.

---

## Estimación

| Área | Horas |
|------|-------|
| Domain Layer | 6 |
| Application Layer | 10 |
| Infrastructure Layer | 4 |
| Presentation Layer | 6 |
| Frontend | 14 |
| **Total** | **40** |

---

## Backend

### Domain Layer

**Módulo:** `modules/attendance`

**Archivos a crear:**

```
modules/attendance/
├── domain/
│   ├── entities/
│   │   ├── attendance-record.entity.ts
│   │   └── justification.entity.ts
│   ├── value-objects/
│   │   ├── attendance-id.value-object.ts
│   │   ├── attendance-status.value-object.ts   # present | absent | late | justified
│   │   └── justification-reason.value-object.ts
│   ├── services/
│   │   ├── attendance-calculation.service.ts
│   │   └── justification.service.ts
│   ├── events/
│   │   ├── attendance-registered.event.ts
│   │   └── attendance-justified.event.ts
│   └── repositories/
│       ├── attendance-record.repository.interface.ts
│       └── justification.repository.interface.ts
```

**Detalles de entidades:**

| Entidad | Campos |
|---------|--------|
| AttendanceRecord | id, tenant_id, student_id, course_id, subject_id (nullable), date, period_start, status, edited_by, edited_at, created_at |
| Justification | id, attendance_record_id, reason, notes, created_by, created_at |

**Lógica clave:**

- `subject_id = NULL` → asistencia diaria (primaria)
- `subject_id != NULL` → asistencia por materia (secundaria)

### Application Layer

**Módulo:** `modules/attendance/application`

**Archivos a crear:**

```
modules/attendance/
├── application/
│   ├── commands/
│   │   ├── register-daily-attendance/
│   │   │   ├── register-daily-attendance.command.ts
│   │   │   └── register-daily-attendance.handler.ts
│   │   ├── justify-attendance/
│   │   │   ├── justify-attendance.command.ts
│   │   │   └── justify-attendance.handler.ts
│   │   ├── bulk-register-attendance/
│   │   │   ├── bulk-register-attendance.command.ts
│   │   │   └── bulk-register-attendance.handler.ts
│   ├── queries/
│   │   ├── get-daily-attendance/
│   │   │   ├── get-daily-attendance.query.ts
│   │   │   └── get-daily-attendance.handler.ts
│   │   ├── get-attendance-by-student/
│   │   ├── get-attendance-history/
│   │   └── get-attendance-metrics/
│   │       ├── get-attendance-metrics.query.ts
│   │       └── get-attendance-metrics.handler.ts
│   ├── dtos/
│   │   ├── register-attendance.request.dto.ts
│   │   ├── attendance-record.response.dto.ts
│   │   ├── daily-attendance.response.dto.ts
│   │   ├── justification.request.dto.ts
│   │   └── attendance-metrics.response.dto.ts
│   └── attendance.module.ts
```

### Infrastructure Layer

**Módulo:** `modules/attendance/infrastructure`

**Archivos a crear:**

```
modules/attendance/
├── infrastructure/
│   ├── persistence/
│   │   ├── repositories/
│   │   │   ├── attendance-record.repository.ts
│   │   │   └── justification.repository.ts
│   │   ├── mappers/
│   │   │   └── attendance-record.mapper.ts
│   │   └── attendance.persistence.module.ts
│   └── events/
│       ├── attendance-registered.handler.ts
│       └── attendance.events.module.ts
```

### Presentation Layer

**Módulo:** `modules/attendance/presentation`

**Archivos a crear:**

```
modules/attendance/
└── presentation/
    ├── controllers/
    │   ├── attendance.controller.ts      # POST /attendance/daily, /attendance/:id/justify
    │   └── attendance-query.controller.ts  # GET /attendance/daily, /attendance/metrics
    └── attendance.presentation.module.ts
```

**Endpoints:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /attendance/daily | Registrar asistencia diaria |
| GET | /attendance/daily?courseId=&date= | Obtener asistencia diaria |
| POST | /attendance/:id/justify | Justificar ausencia |
| GET | /attendance/student/:studentId | Historial de estudiante |
| GET | /attendance/metrics?courseId=&date= | Métricas del día |

---

## Frontend

### Pages

**Archivos a crear:**

```
src/app/
├── (dashboard)/
│   └── attendance/
│       ├── page.tsx                   # /attendance - Redirect a daily
│       ├── daily/
│       │   ├── page.tsx              # /attendance/daily
│       │   └── components/
│       │       ├── daily-attendance-page.tsx
│       │       ├── attendance-toolbar.tsx
│       │       └── daily-attendance-grid.tsx
│       └── components/
│           ├── attendance-layout.tsx
│           └── justification-modal.tsx
```

### Components

**Archivos a crear:**

```
src/components/
├── features/
│   └── attendance/
│       ├── attendance-grid/
│       │   ├── attendance-grid.tsx
│       │   ├── attendance-row.tsx
│       │   ├── attendance-cell.tsx
│       │   └── index.ts
│       ├── attendance-toolbar/
│       │   ├── attendance-toolbar.tsx
│       │   ├── course-selector.tsx
│       │   ├── date-picker.tsx
│       │   ├── quick-actions.tsx
│       │   └── index.ts
│       ├── attendance-summary/
│       │   ├── attendance-summary.tsx
│       │   ├── metrics-card.tsx
│       │   └── index.ts
│       ├── attendance-form/
│       │   ├── attendance-form.tsx
│       │   ├── status-select.tsx
│       │   └── index.ts
│       └── justification-modal/
│           ├── justification-modal.tsx
│           └── index.ts
```

### Hooks

**Archivos a crear:**

```
packages/hooks/
├── src/
│   ├── attendance/
│   │   ├── use-daily-attendance.ts
│   │   ├── use-register-daily-attendance.ts
│   │   ├── use-justify-attendance.ts
│   │   ├── use-attendance-metrics.ts
│   │   └── use-attendance-history.ts
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
│           ├── attendance-calculation.service.spec.ts
│           └── register-daily-attendance.handler.spec.ts
```

---

## Tareas por Día

### Día 1: Domain Layer

- [ ] Crear entidad AttendanceRecord
- [ ] Crear entidad Justification
- [ ] Crear AttendanceCalculationService
- [ ] Definir Value Objects

### Día 2: Application Layer

- [ ] Crear RegisterDailyAttendanceCommand + Handler
- [ ] Crear JustifyAttendanceCommand + Handler
- [ ] Crear GetDailyAttendanceQuery + Handler
- [ ] Crear DTOs

### Día 3: Infrastructure Layer

- [ ] Implementar AttendanceRecordRepository
- [ ] Implementar JustificationRepository
- [ ] Crear AttendanceRecordMapper

### Día 4: Presentation Layer

- [ ] Crear AttendanceController
- [ ] Crear AttendanceQueryController
- [ ] Probar con Postman

### Día 5-6: Frontend

- [ ] Crear página /attendance/daily
- [ ] Crear AttendanceToolbar
- [ ] Crear AttendanceGrid
- [ ] Crear QuickActions
- [ ] Crear JustificationModal
- [ ] Conectar con API

### Día 7: Integración

- [ ] Test del flujo completo
- [ ] Verificar cálculos de métricas
- [ ] Verificar justificación

---

## Criterios de Aceptación

- [ ] Preceptor puede registrar asistencia diaria
- [ ] Grid muestra todos los estudiantes del curso
- [ ] Quick actions funcionan (todos presentes, etc.)
- [ ] Justificación se puede agregar
- [ ] Métricas del día se calculan correctamente
- [ ] Frontend actualiza en tiempo real

---

## Siguiente Sprint

- Sprint 06: Asistencia por Materia (Secundaria)
