# Sprint 06 — Asistencia por Materia (Secundaria)

> **Objetivo:** Extender el sistema de asistencia para secundaria: registro por materia, lógica de tardanzas y funcionalidad de copiar asistencia de clases anteriores.
> **Duración:** 1 semana · **Estimación:** 35 h · **Dependencias:** Sprint 05

---

## Resumen de horas

| Área | Horas |
|---|---|
| Domain Layer | 5 |
| Application Layer | 8 |
| Infrastructure Layer | 4 |
| Presentation Layer | 5 |
| Frontend (UI + hooks + páginas) | 13 |
| **Total** | **35** |

---

## Concepto clave: `subjectId ≠ NULL`

Este sprint implementa el segundo caso del discriminador de `AttendanceRecord`. Cuando `subjectId` tiene valor, el registro corresponde a **asistencia por materia**. La misma entidad sirve para ambos modelos; lo que cambia es la lógica de cálculo y las vistas.

**Tardanzas:** Si el alumno llega después de `AcademicYear.lateCountsAsAbsenceAfterMinutes`, el status `late` se transforma en `absent` para el cómputo del porcentaje. Este cálculo ocurre en `AttendanceCalculationService`.

---

## 1. Domain Layer — `modules/attendance/domain` (ampliar)

```
apps/api/src/modules/attendance/domain/
└── services/
    ├── late-policy.service.ts              # Aplica la política de tardanzas del AcademicYear
    │                                       # isLateCountedAsAbsence(minutesLate, academicYear): boolean
    │                                       # adjustStatus(status, minutesLate, academicYear): AttendanceStatus
    └── attendance-copy.service.ts          # Lógica de copiado de asistencia
                                            # getLastClassRecords(subjectId, beforeDate): AttendanceRecord[]
                                            # → busca la clase más reciente de esa materia antes de la fecha
```

### `attendance-calculation.service.ts` — actualizar

```ts
// Ampliar calculateAbsencePercent para el caso subjectId ≠ NULL:
// 1. Obtener todos los ScheduleSlots de la materia (días de clase en la semana)
// 2. Calcular cuántas clases ocurrieron en el período (slots x semanas hábiles)
// 3. Contar ausencias + tardanzas-que-cuentan-como-ausencia (via LatePolicy)
// 4. return (ausencias / totalClases) * 100
```

---

## 2. Application Layer — `modules/attendance/application` (ampliar)

```
apps/api/src/modules/attendance/application/
├── commands/
│   ├── register-subject-attendance/
│   │   ├── register-subject-attendance.command.ts  # { subjectId, courseId, date, records: { studentId, status }[] }
│   │   └── register-subject-attendance.handler.ts  # igual que daily pero con subjectId poblado
│   │                                               # valida que la fecha sea un día de clase de esa materia (via ScheduleSlot)
│   ├── copy-attendance/
│   │   ├── copy-attendance.command.ts              # { subjectId, targetDate, sourceDate? }
│   │   │                                           # sourceDate = null → usa la clase más reciente
│   │   └── copy-attendance.handler.ts              # busca registros fuente, los replica en targetDate
│   │                                               # no sobreescribe registros ya existentes en targetDate
│   └── bulk-update-subject-status/
│       ├── bulk-update-subject-status.command.ts   # { subjectId, date, defaultStatus }
│       └── bulk-update-subject-status.handler.ts   # quick action: todos presentes/ausentes para una materia
├── queries/
│   ├── get-subject-attendance/
│   │   ├── get-subject-attendance.query.ts         # { subjectId, date }
│   │   └── get-subject-attendance.handler.ts       # similar a daily pero filtra por subjectId
│   ├── get-subject-history/
│   │   ├── get-subject-history.query.ts            # { subjectId, from, to }
│   │   └── get-subject-history.handler.ts          # historial de clases de esa materia con métricas por clase
│   └── get-teacher-subjects/
│       ├── get-teacher-subjects.query.ts           # { teacherId, academicYearId }
│       └── get-teacher-subjects.handler.ts         # las materias que dicta el docente autenticado
├── dtos/
│   ├── register-subject-attendance.request.dto.ts
│   ├── subject-attendance.response.dto.ts          # igual que daily + subjectId, subjectName
│   ├── copy-attendance.request.dto.ts              # sourceDate? (null = última clase)
│   └── subject-history.response.dto.ts             # classDates[], records por fecha
└── attendance.module.ts                            # actualizar
```

---

## 3. Infrastructure Layer — `modules/attendance/infrastructure` (ampliar)

```
apps/api/src/modules/attendance/infrastructure/
├── persistence/
│   └── repositories/
│       └── attendance-record.repository.ts         # ampliar:
│                                                   # findBySubjectAndDate(subjectId, date): filtra subject_id = :id
│                                                   # findLastSubjectClass(subjectId, beforeDate): ORDER BY date DESC LIMIT 1
│                                                   # getSubjectClassDates(subjectId, from, to): fechas de clases con registros
└── attendance.persistence.module.ts               # sin cambios
```

---

## 4. Presentation Layer — `modules/attendance/presentation` (ampliar)

```
apps/api/src/modules/attendance/presentation/
├── controllers/
│   ├── attendance-command.controller.ts    # agregar nuevos endpoints de materia
│   ├── attendance-query.controller.ts     # agregar nuevos GET de materia
│   └── subject-attendance.controller.ts   # controller dedicado a /attendance/subject/*
└── attendance.presentation.module.ts      # actualizar
```

### Endpoints nuevos

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| `POST` | `/attendance/subject` | `teacher`, `admin` | Registrar asistencia de una materia |
| `POST` | `/attendance/subject/all` | `teacher`, `admin` | Marcar todos con un estado |
| `POST` | `/attendance/subject/copy` | `teacher`, `admin` | Copiar asistencia de clase anterior |
| `GET` | `/attendance/subject?subjectId=&date=` | `teacher`, `preceptor`, `admin` | Asistencia de una materia en una fecha |
| `GET` | `/attendance/subject/:subjectId/history?from=&to=` | `teacher`, `preceptor`, `admin` | Historial de clases |
| `GET` | `/attendance/teacher/subjects?academicYearId=` | `teacher` | Materias del docente autenticado |

---

## 5. Frontend

### 5.1 `packages/ui` — componentes nuevos

```
packages/ui/src/components/features/attendance/
├── subject-attendance-grid/
│   ├── index.ts
│   ├── subject-attendance-grid.tsx         # Grilla de asistencia por materia
│   │                                       # Misma estructura que attendance-grid pero con contexto de materia
│   │                                       # Props: records[], subjectName, onStatusChange, isLoading
│   └── subject-attendance-row.tsx          # Fila con nombre del alumno + estado + botón justificar
├── subject-selector/
│   ├── index.ts
│   └── subject-selector.tsx               # Dropdown de materias del docente para ese día
│                                           # Props: subjects[], value, onChange
│                                           # Filtra según el día seleccionado y el horario
├── copy-attendance-modal/
│   ├── index.ts
│   └── copy-attendance-modal.tsx          # Modal para copiar asistencia de una clase anterior
│                                           # Muestra la fecha fuente y cuántos alumnos se copiarán
│                                           # Props: subjectId, targetDate, onCopy, isOpen, onClose
└── subject-attendance-page.tsx            # Composición completa de la página de asistencia por materia
                                            # Combina: Toolbar (con subject selector) + Summary + Grid + CopyModal
                                            # Props: teacherSubjects[], initialSubjectId?, initialDate?
```

### 5.2 `packages/ui` — actualizar componentes existentes

```
packages/ui/src/components/features/attendance/
└── attendance-toolbar/
    └── attendance-toolbar.tsx              # Agregar slot para SubjectSelector cuando level = 'secondary'
                                            # Props: agregar subjects[], selectedSubjectId, onSubjectChange
```

### 5.3 `packages/hooks` — hooks nuevos

> **Patrón:** todos los hooks importan `apiClient` de `../lib/axios-client` (interno de `packages/hooks`) y las rutas de `@vir-ttend/common`. Ningún hook hardcodea URLs ni importa axios directamente.

```
packages/hooks/src/
├── attendance/
│   ├── use-subject-attendance.ts           # useQuery → apiClient.get(attendance/subject?subjectId=&date=
│   ├── use-register-subject-attendance.ts  # useMutation → apiClient.post(attendance/subject
│   ├── use-copy-attendance.ts              # useMutation → apiClient.post(attendance/subject/copy
│   ├── use-teacher-subjects.ts             # useQuery → apiClient.get(attendance/teacher/subjects?academicYearId=
│   └── use-subject-history.ts             # useQuery → apiClient.get(attendance/subject/:id/history
└── index.ts                               # actualizar
```

### 5.4 `apps/client` — páginas

```
apps/client/src/app/(dashboard)/attendance/
└── subject/
    └── page.tsx                            # Importa SubjectAttendancePage de @vir-ttend/ui
                                            # Usa useTeacherSubjects, useSubjectAttendance,
                                            # useRegisterSubjectAttendance, useCopyAttendance
```

---

## 6. Testing

```
apps/api/test/unit/attendance/
├── late-policy.service.spec.ts             # isLateCountedAsAbsence con distintos umbrales
│                                           # adjustStatus con todos los casos
├── attendance-copy.service.spec.ts         # getLastClassRecords: sin clase anterior, con clase anterior
├── register-subject-attendance.handler.spec.ts # validar que la fecha sea día de clase
└── copy-attendance.handler.spec.ts         # copiar sin sobreescribir existentes
```

---

## 7. Tareas por día

### Día 1: Domain Layer
- [ ] Implementar `LatePolicyService`
- [ ] Implementar `AttendanceCopyService`
- [ ] Actualizar `AttendanceCalculationService` para el caso por materia

### Día 2: Application Layer — commands
- [ ] `RegisterSubjectAttendanceCommand` + handler
- [ ] `CopyAttendanceCommand` + handler
- [ ] `BulkUpdateSubjectStatusCommand` + handler

### Día 3: Application Layer — queries + DTOs
- [ ] `GetSubjectAttendanceQuery` + handler
- [ ] `GetSubjectHistoryQuery` + handler
- [ ] `GetTeacherSubjectsQuery` + handler
- [ ] DTOs

### Día 4: Infrastructure + Presentation
- [ ] Ampliar `AttendanceRecordRepository` con nuevos métodos
- [ ] Nuevos controllers y endpoints
- [ ] Probar con Postman

### Día 5–6: Frontend
- [ ] Componentes en `packages/ui`
- [ ] Hooks en `packages/hooks`
- [ ] Página en `apps/client`
- [ ] Probar: seleccionar materia → ver alumnos → registrar → copiar de clase anterior

### Día 7: Integración y tests
- [ ] Test de tardanzas con umbral configurable
- [ ] Test de copiado sin sobreescritura
- [ ] Tests unitarios de servicios

---

## 8. Criterios de aceptación

- [ ] Docente puede registrar asistencia por materia con `subjectId` presente
- [ ] La validación impide registrar en una fecha que no es día de clase de esa materia
- [ ] `LatePolicyService` aplica correctamente el umbral de minutos del `AcademicYear`
- [ ] Copiar asistencia de la clase anterior funciona y no sobreescribe registros existentes
- [ ] `GetTeacherSubjects` retorna solo las materias del docente autenticado
- [ ] `AttendanceCalculationService` calcula porcentaje correctamente para asistencia por materia
- [ ] Frontend muestra SubjectSelector filtrado por día del schedule
- [ ] Modal de copia muestra la fecha fuente antes de confirmar

---

**Siguiente sprint →** Sprint 07: Panel de Preceptoría
