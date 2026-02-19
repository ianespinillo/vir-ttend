# Sprint 03 — Gestión Académica

> **Objetivo:** Implementar la estructura académica de la institución: años lectivos, cursos, materias y horarios.
> **Duración:** 1 semana · **Estimación:** 35 h · **Dependencias:** Sprint 02

---

## Resumen de horas

| Área | Horas |
|---|---|
| Domain Layer | 7 |
| Application Layer | 8 |
| Infrastructure Layer | 5 |
| Presentation Layer | 5 |
| Frontend (UI + hooks + páginas) | 10 |
| **Total** | **35** |

---

## Concepto clave: Estructura académica

Un **AcademicYear** define el año lectivo con su rango de fechas, días no lectivos y umbrales de asistencia. Un **Course** es un grado/división dentro de ese año, con nivel (primaria/secundaria), turno y preceptor asignado. Un **Subject** es una materia del curso dictada por un docente. Los **ScheduleSlots** definen en qué días y horarios ocurre esa materia.

> El `ScheduleSlot` es crítico: el cálculo de porcentaje de asistencia en Sprint 05 lo usa para saber cuántas clases "debieron" ocurrir en un período.

---

## 1. Domain Layer — `modules/academic/domain` (nuevo bounded context)

```
apps/api/src/modules/academic/domain/
├── entities/
│   ├── academic-year.entity.ts             # Año lectivo con configuración de umbrales
│   ├── course.entity.ts                    # Grado/división (ej: "3° B Turno Mañana")
│   ├── subject.entity.ts                   # Materia (ej: "Matemática") con docente asignado
│   └── schedule-slot.entity.ts             # Slot horario: día + hora inicio + hora fin
├── value-objects/
│   ├── academic-year-id.value-object.ts    # UUID tipado
│   ├── course-id.value-object.ts           # UUID tipado
│   ├── subject-id.value-object.ts          # UUID tipado
│   ├── level.value-object.ts               # 'primary' | 'secondary' — con validación
│   ├── shift.value-object.ts               # 'morning' | 'afternoon' | 'evening'
│   └── day-of-week.value-object.ts         # 'monday'...'friday' — con validación
├── services/
│   ├── course.service.ts                   # calcularNombreCompleto(course): "3° B Mañana"
│   │                                       # validarSolapamientoHorario(slots[])
│   └── schedule.service.ts                 # getSlotsForDate(date, courseId): ScheduleSlot[]
│                                           # getWorkingDaysInPeriod(from, to, academicYear): Date[]
├── events/
│   ├── academic-year-created.event.ts
│   ├── course-created.event.ts
│   └── subject-created.event.ts
└── repositories/
    ├── academic-year.repository.interface.ts  # findById, findBySchool, findActive, save
    ├── course.repository.interface.ts          # findById, findByAcademicYear, findByPreceptor, save
    ├── subject.repository.interface.ts         # findById, findByCourse, findByTeacher, save
    └── schedule.repository.interface.ts        # findBySubject, findByCourseAndDay, save, deleteBySubject
```

### Esquema de entidades

| Entidad | Campos |
|---|---|
| `AcademicYear` | `id`, `schoolId`, `year` (int), `startDate`, `endDate`, `nonWorkingDays` (Date[]), `absenceThresholdPercent` (default 75), `lateCountsAsAbsenceAfterMinutes` (default 15), `status` (active/closed) |
| `Course` | `id`, `schoolId`, `tenantId`, `academicYearId`, `preceptorId`, `level`, `yearNumber` (1-7), `division` (A/B/C...), `shift` |
| `Subject` | `id`, `courseId`, `teacherId`, `name`, `area`, `weeklyHours` |
| `ScheduleSlot` | `id`, `subjectId`, `dayOfWeek`, `startTime` (HH:mm), `endTime` (HH:mm) |

### `schedule.service.ts` — comportamiento clave

```ts
// getWorkingDaysInPeriod(from: Date, to: Date, academicYear: AcademicYear): Date[]
// → retorna todos los días del período excluyendo fines de semana y nonWorkingDays
// Este método es consumido por AttendanceCalculationService en Sprint 05
```

---

## 2. Application Layer — `modules/academic/application`

```
apps/api/src/modules/academic/application/
├── commands/
│   ├── create-academic-year/
│   │   ├── create-academic-year.command.ts # { schoolId, year, startDate, endDate, nonWorkingDays[], absenceThresholdPercent, lateCountsAsAbsenceAfterMinutes }
│   │   └── create-academic-year.handler.ts # valida que no exista otro AY activo para esa school+year
│   ├── update-academic-year/
│   │   ├── update-academic-year.command.ts # { academicYearId, nonWorkingDays?, thresholds? }
│   │   └── update-academic-year.handler.ts
│   ├── create-course/
│   │   ├── create-course.command.ts        # { academicYearId, schoolId, level, yearNumber, division, shift, preceptorId }
│   │   └── create-course.handler.ts        # valida que preceptor exista y sea del mismo tenant
│   ├── update-course/
│   │   ├── update-course.command.ts        # { courseId, preceptorId?, shift?, status? }
│   │   └── update-course.handler.ts
│   ├── delete-course/
│   │   ├── delete-course.command.ts        # { courseId }
│   │   └── delete-course.handler.ts        # solo si no tiene asistencias registradas
│   ├── create-subject/
│   │   ├── create-subject.command.ts       # { courseId, teacherId, name, area, weeklyHours }
│   │   └── create-subject.handler.ts       # valida que teacher sea del mismo tenant
│   ├── update-subject/
│   │   ├── update-subject.command.ts       # { subjectId, teacherId?, name?, weeklyHours? }
│   │   └── update-subject.handler.ts
│   ├── delete-subject/
│   │   ├── delete-subject.command.ts       # { subjectId }
│   │   └── delete-subject.handler.ts
│   ├── assign-teacher/
│   │   ├── assign-teacher.command.ts       # { subjectId, teacherId }
│   │   └── assign-teacher.handler.ts       # valida rol teacher del usuario
│   ├── set-schedule/
│   │   ├── set-schedule.command.ts         # { subjectId, slots: { dayOfWeek, startTime, endTime }[] }
│   │   └── set-schedule.handler.ts         # reemplaza slots existentes, valida solapamiento
│   └── assign-preceptor/
│       ├── assign-preceptor.command.ts     # { courseId, preceptorId }
│       └── assign-preceptor.handler.ts     # valida rol preceptor del usuario
├── queries/
│   ├── get-academic-years/
│   │   ├── get-academic-years.query.ts     # { schoolId }
│   │   └── get-academic-years.handler.ts
│   ├── get-active-academic-year/
│   │   ├── get-active-academic-year.query.ts # { schoolId }
│   │   └── get-active-academic-year.handler.ts # retorna el AY con status 'active'
│   ├── get-courses/
│   │   ├── get-courses.query.ts            # { academicYearId, level?, preceptorId? }
│   │   └── get-courses.handler.ts
│   ├── get-course/
│   │   ├── get-course.query.ts             # { courseId }
│   │   └── get-course.handler.ts           # incluye subjects y schedule
│   ├── get-subjects-by-course/
│   │   ├── get-subjects-by-course.query.ts # { courseId }
│   │   └── get-subjects-by-course.handler.ts
│   ├── get-schedule/
│   │   ├── get-schedule.query.ts           # { courseId }
│   │   └── get-schedule.handler.ts         # retorna slots agrupados por materia
│   └── get-courses-by-preceptor/
│       ├── get-courses-by-preceptor.query.ts # { preceptorId, academicYearId }
│       └── get-courses-by-preceptor.handler.ts
├── dtos/
│   ├── create-academic-year.request.dto.ts
│   ├── academic-year.response.dto.ts       # id, year, startDate, endDate, absenceThresholdPercent, status
│   ├── create-course.request.dto.ts
│   ├── course.response.dto.ts              # id, level, yearNumber, division, shift, preceptorId, fullName
│   ├── course-detail.response.dto.ts      # extiende course.response + subjects[] + schedule[]
│   ├── create-subject.request.dto.ts
│   ├── subject.response.dto.ts             # id, name, area, weeklyHours, teacherId
│   ├── set-schedule.request.dto.ts         # slots: { dayOfWeek, startTime, endTime }[]
│   └── schedule-slot.response.dto.ts      # id, subjectId, dayOfWeek, startTime, endTime
└── academic.module.ts                      # registra commands, queries, repos, servicios
```

---

## 3. Infrastructure Layer — `modules/academic/infrastructure`

```
apps/api/src/modules/academic/infrastructure/
├── persistence/
│   ├── entities/
│   │   ├── academic-year.orm-entity.ts     # @Entity() con @Property() para cada campo
│   │   ├── course.orm-entity.ts
│   │   ├── subject.orm-entity.ts
│   │   └── schedule-slot.orm-entity.ts
│   ├── repositories/
│   │   ├── academic-year.repository.ts
│   │   ├── course.repository.ts            # findByPreceptor usa TenantContextService
│   │   ├── subject.repository.ts
│   │   └── schedule.repository.ts
│   ├── mappers/
│   │   ├── academic-year.mapper.ts
│   │   ├── course.mapper.ts
│   │   ├── subject.mapper.ts
│   │   └── schedule-slot.mapper.ts
│   └── academic.persistence.module.ts
└── events/
    ├── academic-year-created.listener.ts   # @OnEvent('academic-year.created') → loguea
    └── academic.events.module.ts
```

### Migración a generar

```bash
pnpm mikro-orm migration:create --name=create_academic_structure
```

Tablas:
- `academic_years` (id, school_id, year, start_date, end_date, non_working_days, absence_threshold_percent, late_counts_as_absence_after_minutes, status)
- `courses` (id, school_id, tenant_id, academic_year_id, preceptor_id, level, year_number, division, shift)
- `subjects` (id, course_id, teacher_id, name, area, weekly_hours)
- `schedule_slots` (id, subject_id, day_of_week, start_time, end_time)

---

## 4. Presentation Layer — `modules/academic/presentation`

```
apps/api/src/modules/academic/presentation/
├── controllers/
│   ├── academic-years.controller.ts        # GET/POST /academic-years, GET/PUT /academic-years/:id
│   ├── courses.controller.ts               # CRUD /courses, PUT /courses/:id/preceptor
│   ├── subjects.controller.ts              # CRUD /subjects, PUT /subjects/:id/teacher
│   └── schedule.controller.ts             # GET /schedule?courseId=, POST /schedule (set-schedule)
└── academic.presentation.module.ts
```

### Endpoints

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| `GET` | `/academic-years?schoolId=` | `admin`, `preceptor` | Listar años académicos |
| `POST` | `/academic-years` | `admin` | Crear año académico |
| `GET` | `/academic-years/:id` | `admin`, `preceptor` | Obtener año académico |
| `PUT` | `/academic-years/:id` | `admin` | Actualizar año académico |
| `GET` | `/courses?academicYearId=&level=` | `admin`, `preceptor` | Listar cursos |
| `POST` | `/courses` | `admin` | Crear curso |
| `GET` | `/courses/:id` | `admin`, `preceptor`, `teacher` | Obtener curso con subjects y schedule |
| `PUT` | `/courses/:id` | `admin` | Actualizar curso |
| `DELETE` | `/courses/:id` | `admin` | Eliminar curso (sin asistencias) |
| `PUT` | `/courses/:id/preceptor` | `admin` | Asignar preceptor |
| `GET` | `/subjects?courseId=` | `admin`, `preceptor`, `teacher` | Listar materias del curso |
| `POST` | `/subjects` | `admin` | Crear materia |
| `PUT` | `/subjects/:id` | `admin` | Actualizar materia |
| `DELETE` | `/subjects/:id` | `admin` | Eliminar materia |
| `PUT` | `/subjects/:id/teacher` | `admin` | Asignar docente |
| `GET` | `/schedule?courseId=` | todos | Horario del curso |
| `POST` | `/schedule` | `admin` | Configurar horario de una materia |

---

## 5. Frontend

### 5.1 `packages/ui` — componentes nuevos

```
packages/ui/src/components/features/
├── academic/
│   ├── academic-year-form.tsx              # Formulario de año lectivo (fechas, umbrales)
│   │                                       # Props: onSubmit, isLoading, defaultValues?
│   ├── academic-year-card.tsx              # Card con año, estado y acciones
│   │                                       # Props: academicYear, onEdit
│   ├── course-form.tsx                     # Formulario: nivel, año, división, turno, preceptor
│   │                                       # Props: onSubmit, isLoading, defaultValues?, preceptors[]
│   ├── courses-list.tsx                    # Lista de cursos con filtro por nivel y turno
│   │                                       # Props: courses[], onEdit, onDelete, onSelectCourse
│   ├── course-card.tsx                     # Card de curso con nombre completo y métricas básicas
│   │                                       # Props: course, onClick
│   └── course-detail.tsx                  # Vista completa del curso: info + subjects + schedule
│                                           # Props: course (CourseDetailResponseDto)
├── subjects/
│   ├── subject-form.tsx                    # Formulario de materia: nombre, área, horas, docente
│   │                                       # Props: onSubmit, isLoading, defaultValues?, teachers[]
│   ├── subjects-list.tsx                   # Lista de materias del curso con acciones
│   │                                       # Props: subjects[], onEdit, onDelete
│   └── subject-card.tsx                   # Card de materia con docente y horas
└── schedule/
    ├── schedule-grid.tsx                   # Grilla semanal (lun-vie x horarios) con slots coloreados
    │                                       # Props: slots[], onEditSlot
    └── schedule-form.tsx                  # Formulario para agregar/editar un slot horario
                                            # Props: subjectId, onSubmit, defaultValues?
```

### 5.2 `packages/hooks` — hooks nuevos

> **Patrón:** todos los hooks importan `apiClient` de `../lib/axios-client` (interno de `packages/hooks`) y las rutas de `@vir-ttend/common`. Ningún hook hardcodea URLs ni importa axios directamente.

```
packages/hooks/src/
├── academic/
│   ├── use-academic-years.ts              # useQuery → apiClient.get(academic-years?schoolId=
│   ├── use-active-academic-year.ts        # useQuery → apiClient.get(academic-years/active?schoolId=
│   ├── use-create-academic-year.ts        # useMutation → apiClient.post(academic-years
│   ├── use-courses.ts                     # useQuery → apiClient.get(courses?academicYearId=&level=
│   ├── use-course.ts                      # useQuery → apiClient.get(courses/:id
│   ├── use-create-course.ts               # useMutation → apiClient.post(courses
│   ├── use-update-course.ts               # useMutation → apiClient.put(courses/:id
│   ├── use-delete-course.ts               # useMutation → apiClient.delete(courses/:id
│   ├── use-subjects.ts                    # useQuery → apiClient.get(subjects?courseId=
│   ├── use-create-subject.ts              # useMutation → apiClient.post(subjects
│   ├── use-update-subject.ts              # useMutation → apiClient.put(subjects/:id
│   ├── use-delete-subject.ts              # useMutation → apiClient.delete(subjects/:id
│   └── use-schedule.ts                    # useQuery → apiClient.get(schedule?courseId=
└── index.ts                               # actualizar re-exports
```

### 5.3 `apps/client` — páginas

```
apps/client/src/app/(dashboard)/
├── courses/
│   ├── page.tsx                            # Importa CoursesList de @vir-ttend/ui
│   │                                       # Usa useCourses, useActiveAcademicYear
│   ├── create/
│   │   └── page.tsx                        # Importa CourseForm de @vir-ttend/ui
│   │                                       # Usa useCreateCourse
│   └── [id]/
│       └── page.tsx                        # Importa CourseDetail de @vir-ttend/ui
│                                           # Usa useCourse, useSubjects, useSchedule
└── settings/
    └── academic/
        └── page.tsx                        # Importa AcademicYearForm y lista
                                            # Usa useAcademicYears, useCreateAcademicYear
```

---

## 6. Testing

```
apps/api/test/unit/academic/
├── course.service.spec.ts                  # calcularNombreCompleto, validarSolapamiento
├── schedule.service.spec.ts               # getWorkingDaysInPeriod con nonWorkingDays y fines de semana
├── create-course.handler.spec.ts          # mock repos, verificar validación de preceptor
└── set-schedule.handler.spec.ts           # verificar solapamiento rechazado
```

---

## 7. Tareas por día

### Día 1: Domain Layer
- [ ] Crear entidades de dominio (AcademicYear, Course, Subject, ScheduleSlot)
- [ ] Crear Value Objects (Level, Shift, DayOfWeek)
- [ ] Implementar `CourseService` y `ScheduleService`
- [ ] Definir interfaces de repositorios

### Día 2: Application Layer — commands
- [ ] Commands y handlers de AcademicYear
- [ ] Commands y handlers de Course
- [ ] Commands y handlers de Subject y Schedule

### Día 3: Application Layer — queries + DTOs
- [ ] Queries y handlers de Course/Subject/Schedule
- [ ] Todos los DTOs con validaciones

### Día 4: Infrastructure Layer
- [ ] ORM entities y mappers
- [ ] Repositorios
- [ ] Generar y ejecutar migración

### Día 5: Presentation Layer
- [ ] Controllers con guards y roles
- [ ] Probar todos los endpoints con Postman

### Día 6–7: Frontend
- [ ] Componentes en `packages/ui`
- [ ] Hooks en `packages/hooks`
- [ ] Páginas en `apps/client`

---

## 8. Criterios de aceptación

- [ ] CRUD completo de AcademicYear, Course y Subject funciona
- [ ] Asignar preceptor y docente funciona con validación de roles
- [ ] Schedule grid muestra correctamente los slots por materia
- [ ] `getWorkingDaysInPeriod` excluye correctamente fines de semana y días no lectivos
- [ ] Un preceptor solo ve los cursos que tiene asignados
- [ ] Frontend permite crear y visualizar cursos y sus materias

---

**Siguiente sprint →** Sprint 04: Gestión de Estudiantes
