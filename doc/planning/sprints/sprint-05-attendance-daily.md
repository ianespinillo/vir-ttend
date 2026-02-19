# Sprint 05 — Asistencia Diaria (Primaria)

> **Objetivo:** Implementar el registro diario de asistencia para educación primaria, incluyendo registro masivo, justificaciones y cálculo de métricas.
> **Duración:** 1 semana · **Estimación:** 40 h · **Dependencias:** Sprint 04

---

## Resumen de horas

| Área | Horas |
|---|---|
| Domain Layer | 7 |
| Application Layer | 10 |
| Infrastructure Layer | 5 |
| Presentation Layer | 5 |
| Frontend (UI + hooks + páginas) | 13 |
| **Total** | **40** |

---

## Concepto clave: Discriminador `subjectId`

La entidad `AttendanceRecord` sirve para **ambos** sistemas de asistencia:
- `subjectId = NULL` → **asistencia diaria** (primaria): un registro por estudiante por día
- `subjectId ≠ NULL` → **asistencia por materia** (secundaria, Sprint 06): un registro por estudiante por materia por clase

Este sprint solo implementa el caso `subjectId = NULL`. El campo `subjectId` existe en la entidad pero siempre será `null` aquí.

---

## 1. Domain Layer — `modules/attendance/domain` (nuevo bounded context)

```
apps/api/src/modules/attendance/domain/
├── entities/
│   ├── attendance-record.entity.ts         # Aggregate root — un registro de asistencia
│   └── justification.entity.ts             # Justificación adjunta a un registro de ausencia
├── value-objects/
│   ├── attendance-record-id.value-object.ts
│   ├── attendance-status.value-object.ts   # 'present' | 'absent' | 'late' | 'justified'
│   │                                       # valida que el valor sea uno de los permitidos
│   └── justification-reason.value-object.ts # texto no vacío, máx 500 chars
├── services/
│   ├── attendance-calculation.service.ts   # Lógica de cálculo de porcentajes
│   │                                       # calculateAbsencePercent(records[], academicYear): number
│   │                                       # getExpectedClasses(from, to, academicYear): number
│   │                                       # Usa ScheduleService del contexto academic (via interface)
│   └── justification.service.ts            # canJustify(record): boolean
│                                           # Solo ausencias, solo dentro del año académico activo
├── events/
│   ├── attendance-registered.event.ts      # Se emite al guardar registros — dispara ThresholdChecker en Sprint 08
│   └── attendance-justified.event.ts       # Se emite al justificar una ausencia
└── repositories/
    ├── attendance-record.repository.interface.ts # findById, findByCourseAndDate, findByStudent,
    │                                             # findByDateRange, bulkSave, save
    └── justification.repository.interface.ts     # findByRecord, save
```

### Esquema de entidades

| Entidad | Campos |
|---|---|
| `AttendanceRecord` | `id`, `tenantId`, `studentId`, `courseId`, `subjectId` (nullable), `date`, `status`, `editedBy` (userId), `editedAt`, `createdAt` |
| `Justification` | `id`, `attendanceRecordId`, `reason`, `notes` (nullable), `createdBy` (userId), `createdAt` |

### `attendance-calculation.service.ts` — lógica detallada

```ts
// calculateAbsencePercent(studentId, courseId, from, to, academicYear):
//   1. Obtener registros del estudiante en el período
//   2. Obtener días hábiles con getWorkingDaysInPeriod() del academic context
//   3. Contar ausencias (absent + late que supera umbral)
//   4. return (ausencias / totalDíasHábiles) * 100
//
// IMPORTANTE: 'late' se cuenta como ausencia si el AcademicYear.lateCountsAsAbsenceAfterMinutes
// aplica — esta lógica se expande en Sprint 06 para asistencia por materia
```

---

## 2. Application Layer — `modules/attendance/application`

```
apps/api/src/modules/attendance/application/
├── commands/
│   ├── register-daily-attendance/
│   │   ├── register-daily-attendance.command.ts    # { courseId, date, records: { studentId, status }[] }
│   │   └── register-daily-attendance.handler.ts   # BULK: crea/actualiza un AttendanceRecord por alumno
│   │                                               # Si ya existe registro para ese día, lo actualiza
│   │                                               # Al finalizar: emite AttendanceRegistered por cada record
│   ├── bulk-register-attendance/
│   │   ├── bulk-register-attendance.command.ts     # { courseId, date, defaultStatus: 'present' | 'absent' }
│   │   └── bulk-register-attendance.handler.ts     # Registra todos los alumnos con el mismo estado
│   │                                               # Útil para "marcar todos presentes" en un click
│   └── justify-attendance/
│       ├── justify-attendance.command.ts           # { attendanceRecordId, reason, notes?, justifiedBy }
│       └── justify-attendance.handler.ts           # Crea Justification, cambia status a 'justified'
│                                                   # Emite AttendanceJustified event
├── queries/
│   ├── get-daily-attendance/
│   │   ├── get-daily-attendance.query.ts           # { courseId, date }
│   │   └── get-daily-attendance.handler.ts         # Retorna lista de alumnos con su estado del día
│   │                                               # Si no hay registro aún, incluye alumno con status null
│   ├── get-attendance-by-student/
│   │   ├── get-attendance-by-student.query.ts      # { studentId, from, to }
│   │   └── get-attendance-by-student.handler.ts    # Historial del estudiante en el período
│   ├── get-attendance-history/
│   │   ├── get-attendance-history.query.ts         # { courseId, from, to }
│   │   └── get-attendance-history.handler.ts       # Historial completo del curso (para reportes)
│   └── get-attendance-metrics/
│       ├── get-attendance-metrics.query.ts         # { courseId, date }
│       └── get-attendance-metrics.handler.ts       # Retorna métricas del día:
│                                                   # totalStudents, present, absent, late, justified
│                                                   # absentPercent, studentsAtRisk[]
├── dtos/
│   ├── register-attendance-record.dto.ts          # { studentId, status: AttendanceStatus }
│   ├── register-daily-attendance.request.dto.ts   # { courseId, date, records[] }
│   ├── bulk-register-attendance.request.dto.ts    # { courseId, date, defaultStatus }
│   ├── justify-attendance.request.dto.ts          # { reason, notes? }
│   ├── attendance-record.response.dto.ts          # id, studentId, studentName, status, editedAt, justification?
│   ├── daily-attendance.response.dto.ts           # date, courseId, records[], metrics
│   ├── attendance-metrics.response.dto.ts         # totalStudents, present, absent, late, justified, absentPercent, studentsAtRisk[]
│   └── attendance-history.response.dto.ts         # { studentId, studentName, records: { date, status }[] }
└── attendance.module.ts                           # registra commands, queries, repos, servicios
```

---

## 3. Infrastructure Layer — `modules/attendance/infrastructure`

```
apps/api/src/modules/attendance/infrastructure/
├── persistence/
│   ├── entities/
│   │   ├── attendance-record.orm-entity.ts         # @Entity() con @Index(['course_id', 'date', 'subject_id'])
│   │   └── justification.orm-entity.ts
│   ├── repositories/
│   │   ├── attendance-record.repository.ts         # implementa IAttendanceRecordRepository
│   │   │                                           # bulkSave usa em.persistAndFlush([...records])
│   │   │                                           # findByCourseAndDate filtra subject_id IS NULL (diaria)
│   │   └── justification.repository.ts
│   ├── mappers/
│   │   ├── attendance-record.mapper.ts
│   │   └── justification.mapper.ts
│   └── attendance.persistence.module.ts
└── events/
    ├── attendance-registered.listener.ts          # @OnEvent('attendance.registered') → loguea
    │                                               # En Sprint 08 se reemplaza por ThresholdChecker
    └── attendance.events.module.ts
```

### Migración a generar

```bash
pnpm mikro-orm migration:create --name=create_attendance_records_and_justifications
```

Tablas:
- `attendance_records` (id, tenant_id, student_id, course_id, subject_id, date, status, edited_by, edited_at, created_at)
- `justifications` (id, attendance_record_id, reason, notes, created_by, created_at)
- Índice único: `(student_id, course_id, date, subject_id)` — evita duplicados
- Índice: `(course_id, date)` — consulta más frecuente

---

## 4. Presentation Layer — `modules/attendance/presentation`

```
apps/api/src/modules/attendance/presentation/
├── controllers/
│   ├── attendance-command.controller.ts    # POST endpoints de escritura
│   └── attendance-query.controller.ts     # GET endpoints de lectura
└── attendance.presentation.module.ts
```

### Endpoints

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| `POST` | `/attendance/daily` | `preceptor`, `admin` | Registrar asistencia diaria (bulk) |
| `POST` | `/attendance/daily/all` | `preceptor`, `admin` | Marcar todos con un estado (quick action) |
| `POST` | `/attendance/:id/justify` | `preceptor`, `admin` | Justificar una ausencia |
| `GET` | `/attendance/daily?courseId=&date=` | `preceptor`, `admin` | Obtener lista del día |
| `GET` | `/attendance/metrics?courseId=&date=` | `preceptor`, `admin` | Métricas del día |
| `GET` | `/attendance/student/:studentId?from=&to=` | `preceptor`, `admin` | Historial del estudiante |
| `GET` | `/attendance/history?courseId=&from=&to=` | `preceptor`, `admin` | Historial del curso |

---

## 5. Frontend

### 5.1 `packages/ui` — componentes nuevos

```
packages/ui/src/components/features/attendance/
├── attendance-toolbar/
│   ├── index.ts                            # re-export
│   ├── attendance-toolbar.tsx              # Barra de herramientas: selector de curso + datepicker + quick actions
│   │                                       # Props: courses[], selectedCourseId, selectedDate, onCourseChange, onDateChange
│   ├── course-selector.tsx                 # Dropdown de cursos del preceptor
│   │                                       # Props: courses[], value, onChange
│   ├── date-picker.tsx                     # Selector de fecha (solo días hábiles)
│   │                                       # Props: value, onChange, disabledDates[]
│   └── quick-actions.tsx                   # Botones: "Todos presentes" | "Todos ausentes"
│                                           # Props: onMarkAll(status), isLoading
├── attendance-grid/
│   ├── index.ts
│   ├── attendance-grid.tsx                 # Lista de alumnos con selector de estado por fila
│   │                                       # Props: records[], onStatusChange, isLoading
│   ├── attendance-row.tsx                  # Fila de un alumno: nombre + selector de estado + botón justificar
│   │                                       # Props: record, onStatusChange, onJustify
│   └── attendance-status-select.tsx        # Select con los 4 estados coloreados
│                                           # Props: value, onChange, disabled?
├── attendance-summary/
│   ├── index.ts
│   ├── attendance-summary.tsx              # Panel de métricas del día
│   │                                       # Props: metrics: AttendanceMetricsResponseDto
│   └── metric-card.tsx                     # Card individual: ícono + número + label
│                                           # Props: icon, value, label, color
├── justification-modal/
│   ├── index.ts
│   └── justification-modal.tsx            # Modal para agregar justificación
│                                           # Props: record, onJustify, isOpen, onClose, isLoading
└── daily-attendance-page.tsx              # Composición completa de la página de asistencia diaria
                                            # Combina: Toolbar + Summary + Grid
                                            # Props: courses[], initialCourseId?, initialDate?
```

### 5.2 `packages/hooks` — hooks nuevos

> **Patrón:** todos los hooks importan `apiClient` de `../lib/axios-client` (interno de `packages/hooks`) y las rutas de `@vir-ttend/common`. Ningún hook hardcodea URLs ni importa axios directamente.

```
packages/hooks/src/
├── attendance/
│   ├── use-daily-attendance.ts             # useQuery → apiClient.get(attendance/daily?courseId=&date=
│   ├── use-attendance-metrics.ts           # useQuery → apiClient.get(attendance/metrics?courseId=&date=
│   ├── use-register-daily-attendance.ts    # useMutation → apiClient.post(attendance/daily
│   │                                       # onSuccess: invalida daily-attendance y metrics
│   ├── use-bulk-register-attendance.ts     # useMutation → apiClient.post(attendance/daily/all
│   ├── use-justify-attendance.ts           # useMutation → apiClient.post(attendance/:id/justify
│   │                                       # onSuccess: invalida daily-attendance del día
│   └── use-attendance-history.ts          # useQuery → apiClient.get(attendance/student/:id
└── index.ts                               # actualizar re-exports
```

### 5.3 `apps/client` — páginas

```
apps/client/src/app/(dashboard)/
└── attendance/
    ├── page.tsx                            # Redirige a /attendance/daily
    └── daily/
        └── page.tsx                        # Importa DailyAttendancePage de @vir-ttend/ui
                                            # Usa useDailyAttendance, useAttendanceMetrics,
                                            # useRegisterDailyAttendance, useBulkRegisterAttendance,
                                            # useJustifyAttendance, useCoursesByPreceptor
```

---

## 6. Testing

```
apps/api/test/unit/attendance/
├── attendance-calculation.service.spec.ts  # calculateAbsencePercent con distintos escenarios
│                                           # incluye días no hábiles, tardanzas, justificaciones
├── register-daily-attendance.handler.spec.ts # mock repos, verificar bulk save y eventos
├── bulk-register-attendance.handler.spec.ts # verificar que genera N records con mismo estado
└── justify-attendance.handler.spec.ts      # verificar cambio de status y creación de Justification
```

---

## 7. Tareas por día

### Día 1: Domain Layer
- [ ] Crear `AttendanceRecord` y `Justification` entities
- [ ] Crear Value Objects
- [ ] Implementar `AttendanceCalculationService` con lógica de porcentajes
- [ ] Implementar `JustificationService`
- [ ] Definir interfaces de repositorios

### Día 2: Application Layer — commands
- [ ] `RegisterDailyAttendanceCommand` + handler (bulk)
- [ ] `BulkRegisterAttendanceCommand` + handler (quick action)
- [ ] `JustifyAttendanceCommand` + handler

### Día 3: Application Layer — queries + DTOs
- [ ] `GetDailyAttendanceQuery` + handler (con alumnos sin registro)
- [ ] `GetAttendanceMetricsQuery` + handler
- [ ] `GetAttendanceByStudentQuery` + handler
- [ ] Todos los DTOs

### Día 4: Infrastructure Layer
- [ ] ORM entities con índices correctos
- [ ] Repositorios (atención especial a `bulkSave` y filtro `subject_id IS NULL`)
- [ ] Mappers
- [ ] Generar y ejecutar migración

### Día 5: Presentation Layer
- [ ] Controllers (command y query separados)
- [ ] Guards y roles en cada endpoint
- [ ] Probar todos los endpoints con Postman

### Día 6–7: Frontend
- [ ] Todos los componentes en `packages/ui`
- [ ] Hooks en `packages/hooks`
- [ ] Página en `apps/client`
- [ ] Probar flujo completo: seleccionar curso → ver alumnos → marcar → justificar

---

## 8. Criterios de aceptación

- [ ] Preceptor puede registrar asistencia de todos los alumnos de un curso en un día
- [ ] "Marcar todos presentes/ausentes" funciona en un click
- [ ] Editar el estado de un alumno ya registrado actualiza el registro (no crea duplicado)
- [ ] Justificación cambia el status de 'absent' a 'justified'
- [ ] Métricas del día se calculan correctamente (% ausencias, alumnos en riesgo)
- [ ] El cálculo de porcentaje usa `getWorkingDaysInPeriod` y excluye días no lectivos
- [ ] Frontend muestra la grilla con los 4 estados con colores distintos
- [ ] Quick actions actualizan la grilla inmediatamente (optimistic update)

---

**Siguiente sprint →** Sprint 06: Asistencia por Materia (Secundaria)
