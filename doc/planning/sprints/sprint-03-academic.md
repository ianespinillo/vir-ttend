# Sprint 03: Gestión Académica

**Objetivo:** Gestión de AcademicYear, Course y Subject  
**Duración:** 1 semana  
**Estimación:** 35 horas  
**Depende de:** Sprint 02 (Users/Tenants)

---

## Objetivo

Implementar la gestión de años académicos, cursos y materias. Establecer la estructura académica de la institución.

---

## Estimación

| Área | Horas |
|------|-------|
| Domain Layer | 6 |
| Application Layer | 8 |
| Infrastructure Layer | 4 |
| Presentation Layer | 5 |
| Frontend | 12 |
| **Total** | **35** |

---

## Backend

### Domain Layer

**Módulo:** `modules/academic`

**Archivos a crear:**

```
modules/academic/
├── domain/
│   ├── entities/
│   │   ├── academic-year.entity.ts
│   │   ├── course.entity.ts
│   │   ├── subject.entity.ts
│   │   └── schedule-slot.entity.ts
│   ├── value-objects/
│   │   ├── academic-year-id.value-object.ts
│   │   ├── course-id.value-object.ts
│   │   ├── subject-id.value-object.ts
│   │   └── level.value-object.ts       # primaria | secundaria
│   ├── services/
│   │   ├── course.service.ts
│   │   └── schedule.service.ts
│   ├── events/
│   │   ├── academic-year-created.event.ts
│   │   ├── course-created.event.ts
│   │   └── subject-created.event.ts
│   └── repositories/
│       ├── academic-year.repository.interface.ts
│       ├── course.repository.interface.ts
│       ├── subject.repository.interface.ts
│       └── schedule.repository.interface.ts
```

**Detalles de entidades:**

| Entidad | Campos |
|---------|--------|
| AcademicYear | id, school_id, year, start_date, end_date, non_working_days[], absence_threshold_percent, late_counts_as_absence_after |
| Course | id, school_id, tenant_id, academic_year_id, preceptor_id, level, year_number, division, shift |
| Subject | id, course_id, teacher_id, name, area, weekly_hours |
| ScheduleSlot | id, subject_id, day_of_week, start_time, end_time |

### Application Layer

**Módulo:** `modules/academic/application`

**Archivos a crear:**

```
modules/academic/
├── application/
│   ├── commands/
│   │   ├── create-academic-year/
│   │   ├── update-academic-year/
│   │   ├── create-course/
│   │   ├── update-course/
│   │   ├── delete-course/
│   │   ├── create-subject/
│   │   ├── update-subject/
│   │   ├── delete-subject/
│   │   ├── assign-teacher/
│   │   └── assign-preceptor/
│   ├── queries/
│   │   ├── get-academic-years/
│   │   ├── get-academic-year/
│   │   ├── get-courses/
│   │   ├── get-course/
│   │   ├── get-subjects/
│   │   ├── get-subject/
│   │   ├── get-subjects-by-course/
│   │   ├── get-schedule/
│   │   └── get-courses-by-preceptor/
│   ├── dtos/
│   │   ├── academic-year.request.dto.ts
│   │   ├── academic-year.response.dto.ts
│   │   ├── course.request.dto.ts
│   │   ├── course.response.dto.ts
│   │   ├── subject.request.dto.ts
│   │   ├── subject.response.dto.ts
│   │   └── schedule.response.dto.ts
│   └── academic.module.ts
```

### Infrastructure Layer

**Módulo:** `modules/academic/infrastructure`

**Archivos a crear:**

```
modules/academic/
├── infrastructure/
│   ├── persistence/
│   │   ├── repositories/
│   │   │   ├── academic-year.repository.ts
│   │   │   ├── course.repository.ts
│   │   │   ├── subject.repository.ts
│   │   │   └── schedule.repository.ts
│   │   ├── mappers/
│   │   │   ├── course.mapper.ts
│   │   │   └── subject.mapper.ts
│   │   └── academic.persistence.module.ts
│   └── events/
│       └── academic.events.module.ts
```

### Presentation Layer

**Módulo:** `modules/academic/presentation`

**Archivos a crear:**

```
modules/academic/
└── presentation/
    ├── controllers/
    │   ├── academic-years.controller.ts    # CRUD /academic-years
    │   ├── courses.controller.ts          # CRUD /courses
    │   ├── subjects.controller.ts         # CRUD /subjects
    │   └── schedule.controller.ts         # GET /schedule
    └── academic.presentation.module.ts
```

**Endpoints:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /academic-years | Listar años académicos |
| POST | /academic-years | Crear año académico |
| GET | /academic-years/:id | Obtener año académico |
| PUT | /academic-years/:id | Actualizar año académico |
| GET | /courses | Listar cursos |
| POST | /courses | Crear curso |
| GET | /courses/:id | Obtener curso |
| PUT | /courses/:id | Actualizar curso |
| DELETE | /courses/:id | Eliminar curso |
| GET | /subjects | Listar materias |
| POST | /subjects | Crear materia |
| GET | /subjects/:id | Obtener materia |
| PUT | /subjects/:id | Actualizar materia |
| DELETE | /subjects/:id | Eliminar materia |
| GET | /schedule?courseId= | Obtener horario |

---

## Frontend

### Pages

**Archivos a crear:**

```
src/app/
├── (dashboard)/
│   └── courses/
│       ├── page.tsx               # /courses
│       ├── [id]/
│       │   └── page.tsx           # /courses/:id
│       ├── create/
│       │   └── page.tsx           # /courses/create
│       └── components/
│           ├── courses-list.tsx
│           ├── course-form.tsx
│           └── course-detail.tsx
```

### Components

**Archivos a crear:**

```
src/components/
├── features/
│   ├── courses/
│   │   ├── courses-list.tsx
│   │   ├── course-card.tsx
│   │   ├── course-form.tsx
│   │   └── course-detail.tsx
│   ├── subjects/
│   │   ├── subjects-list.tsx
│   │   ├── subject-form.tsx
│   │   └── subject-select.tsx
│   └── schedule/
│       ├── schedule-grid.tsx
│       └── schedule-card.tsx
```

### Hooks

**Archivos a crear:**

```
packages/hooks/
├── src/
│   ├── academic/
│   │   ├── use-academic-years.ts
│   │   ├── use-create-academic-year.ts
│   │   ├── use-courses.ts
│   │   ├── use-course.ts
│   │   ├── use-create-course.ts
│   │   ├── use-update-course.ts
│   │   ├── use-subjects.ts
│   │   ├── use-subject.ts
│   │   ├── use-create-subject.ts
│   │   ├── use-update-subject.ts
│   │   └── use-schedule.ts
│   └── index.ts   # Actualizar
```

---

## Testing

**Archivos a crear:**

```
apps/api/
├── test/
│   └── unit/
│       └── academic/
│           ├── course.service.spec.ts
│           └── schedule.service.spec.ts
```

---

## Tareas por Día

### Día 1: Domain Layer

- [ ] Crear entidades AcademicYear, Course, Subject
- [ ] Crear ScheduleSlot
- [ ] Crear Value Objects (Level enum)
- [ ] Crear CourseService, ScheduleService

### Día 2: Application Layer

- [ ] Crear commands de Course CRUD
- [ ] Crear commands de Subject CRUD
- [ ] Crear queries de Course, Subject, Schedule
- [ ] Crear DTOs

### Día 3: Infrastructure Layer

- [ ] Implementar CourseRepository
- [ ] Implementar SubjectRepository
- [ ] Implementar ScheduleRepository

### Día 4: Presentation Layer

- [ ] Crear CoursesController
- [ ] Crear SubjectsController
- [ ] Crear AcademicYearsController
- [ ] Crear ScheduleController
- [ ] Probar con Postman

### Día 5-6: Frontend

- [ ] Crear página /courses
- [ ] Crear CourseForm
- [ ] Crear CourseDetail
- [ ] Crear página de subjects
- [ ] Crear ScheduleGrid
- [ ] Conectar con API

### Día 7: Integración

- [ ] Test de relaciones Course->Subject
- [ ] Test de Schedule
- [ ] Verificar filtros por tenant

---

## Criterios de Aceptación

- [ ] CRUD de AcademicYear funciona
- [ ] CRUD de Course funciona
- [ ] CRUD de Subject funciona
- [ ] Asignar preceptor a curso funciona
- [ ] Asignar docente a materia funciona
- [ ] Schedule retorna los slots correctos
- [ ] Frontend muestra lista de cursos
- [ ] Frontend muestra formulario de creación

---

## Siguiente Sprint

- Sprint 04: Gestión de Estudiantes (Student, Matriculación)
