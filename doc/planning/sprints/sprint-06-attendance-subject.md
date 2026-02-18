# Sprint 06: Asistencia por Materia (Secundaria)

**Objetivo:** Registro de asistencia por materia para educación secundaria  
**Duración:** 1 semana  
**Estimación:** 35 horas  
**Depende de:** Sprint 05 (Attendance Daily)

---

## Objetivo

Implementar el sistema de registro de asistencia por materia para educación secundaria, incluyendo tardanzas y copy de asistencia.

---

## Estimación

| Área | Horas |
|------|-------|
| Domain Layer | 4 |
| Application Layer | 8 |
| Infrastructure Layer | 3 |
| Presentation Layer | 6 |
| Frontend | 14 |
| **Total** | **35** |

---

## Backend

### Domain Layer

**Módulo:** `modules/attendance`

**Archivos a crear/actualizar:**

```
modules/attendance/
├── domain/
│   ├── services/
│   │   ├── late-policy.service.ts      # NUEVO
│   │   └── attendance-copy.service.ts  # NUEVO
│   └── domain/
│       └── attendance.types.ts         # Tipos adicionales
```

**Lógica clave:**

- `subject_id != NULL` → asistencia por materia (secundaria)
- Late counts as absence después de X minutos (configurable por AcademicYear)

### Application Layer

**Módulo:** `modules/attendance/application`

**Archivos a crear:**

```
modules/attendance/
├── application/
│   ├── commands/
│   │   ├── register-subject-attendance/
│   │   │   ├── register-subject-attendance.command.ts
│   │   │   └── register-subject-attendance.handler.ts
│   │   ├── copy-attendance/
│   │   │   ├── copy-attendance.command.ts
│   │   │   └── copy-attendance.handler.ts
│   │   └── bulk-update-status/
│   │       ├── bulk-update-status.command.ts
│   │       └── bulk-update-status.handler.ts
│   ├── queries/
│   │   ├── get-subject-attendance/
│   │   │   ├── get-subject-attendance.query.ts
│   │   │   └── get-subject-attendance.handler.ts
│   │   ├── get-subject-history/
│   │   │   └── get-subject-history.handler.ts
│   │   └── get-teacher-subjects/
│   │       └── get-teacher-subjects.handler.ts
│   ├── dtos/
│   │   ├── register-subject-attendance.request.dto.ts
│   │   ├── subject-attendance.response.dto.ts
│   │   └── copy-attendance.dto.ts
│   └── attendance.module.ts   # Actualizar
```

### Infrastructure Layer

**Módulo:** `modules/attendance/infrastructure`

**Archivos a crear/actualizar:**

```
modules/attendance/
├── infrastructure/
│   ├── persistence/
│   │   └── repositories/
│   │       └── attendance-record.repository.ts   # Actualizar para subject
│   └── attendance.persistence.module.ts   # Actualizar
```

### Presentation Layer

**Módulo:** `modules/attendance/presentation`

**Archivos a crear/actualizar:**

```
modules/attendance/
└── presentation/
    ├── controllers/
    │   ├── attendance.controller.ts      # Agregar endpoints de materia
    │   └── subjects-attendance.controller.ts  # NUEVO
    └── attendance.presentation.module.ts   # Actualizar
```

**Endpoints adicionales:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /attendance/subject | Registrar asistencia por materia |
| GET | /attendance/subject?subjectId=&date= | Obtener asistencia por materia |
| POST | /attendance/copy | Copiar asistencia |
| GET | /attendance/subject/:subjectId/history | Historial por materia |
| GET | /attendance/teacher/subjects | Materias del docente |

---

## Frontend

### Pages

**Archivos a crear:**

```
src/app/
├── (dashboard)/
│   └── attendance/
│       ├── subject/
│       │   ├── page.tsx              # /attendance/subject
│       │   └── components/
│       │       ├── subject-attendance-page.tsx
│       │       ├── subject-selector.tsx
│       │       └── subject-attendance-grid.tsx
│       └── components/
│           └── copy-attendance-modal.tsx
```

### Components

**Archivos a crear:**

```
src/components/
├── features/
│   └── attendance/
│       ├── subject-attendance-grid/
│       │   ├── subject-attendance-grid.tsx
│       │   ├── subject-attendance-row.tsx
│       │   └── index.ts
│       ├── subject-selector/
│       │   ├── subject-selector.tsx
│       │   └── index.ts
│       └── copy-attendance-modal/
│           ├── copy-attendance-modal.tsx
│           └── index.ts
```

### Hooks

**Archivos a crear:**

```
packages/hooks/
├── src/
│   ├── attendance/
│   │   ├── use-subject-attendance.ts
│   │   ├── use-register-subject-attendance.ts
│   │   ├── use-copy-attendance.ts
│   │   ├── use-teacher-subjects.ts
│   │   └── use-subject-history.ts
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
│           ├── late-policy.service.spec.ts
│           └── attendance-copy.service.spec.ts
```

---

## Tareas por Día

### Día 1: Domain Layer

- [ ] Crear LatePolicyService
- [ ] Crear AttendanceCopyService

### Día 2: Application Layer

- [ ] Crear RegisterSubjectAttendanceCommand + Handler
- [ ] Crear CopyAttendanceCommand + Handler
- [ ] Crear GetSubjectAttendanceQuery
- [ ] Crear DTOs

### Día 3: Infrastructure Layer

- [ ] Actualizar AttendanceRecordRepository para subject
- [ ] Agregar métodos de query

### Día 4: Presentation Layer

- [ ] Actualizar AttendanceController
- [ ] Crear SubjectsAttendanceController
- [ ] Probar con Postman

### Día 5-6: Frontend

- [ ] Crear página /attendance/subject
- [ ] Crear SubjectSelector
- [ ] Crear SubjectAttendanceGrid
- [ ] Crear CopyAttendanceModal
- [ ] Conectar con API

### Día 7: Integración

- [ ] Test de tardanzas
- [ ] Test de copy attendance
- [ ] Verificar validación de secundaria

---

## Criterios de Aceptación

- [ ] Docente puede registrar asistencia por materia
- [ ] Grid filtra correctamente por materia
- [ ] Tardanzas se calculan automáticamente
- [ ] Copiar asistencia de ayer funciona
- [ ] Copiar asistencia de otra materia funciona
- [ ] Frontend actualiza correctamente

---

## Siguiente Sprint

- Sprint 07: Panel de Preceptoría
