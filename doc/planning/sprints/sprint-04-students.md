# Sprint 04: Gestión de Estudiantes

**Objetivo:** Gestión de estudiantes y matriculación  
**Duración:** 1 semana  
**Estimación:** 30 horas  
**Depende de:** Sprint 03 (Academic)

---

## Objetivo

Implementar la gestión completa de estudiantes, matriculación en cursos, y datos de tutores.

---

## Estimación

| Área | Horas |
|------|-------|
| Domain Layer | 5 |
| Application Layer | 6 |
| Infrastructure Layer | 3 |
| Presentation Layer | 4 |
| Frontend | 12 |
| **Total** | **30** |

---

## Backend

### Domain Layer

**Módulo:** `modules/academic`

**Archivos a crear/actualizar:**

```
modules/academic/
├── domain/
│   ├── entities/
│   │   └── student.entity.ts      # NUEVO
│   ├── value-objects/
│   │   ├── student-id.value-object.ts  # NUEVO
│   │   └── document.value-object.ts    # NUEVO
│   ├── services/
│   │   ├── student.service.ts          # NUEVO
│   │   └── enrollment.service.ts       # NUEVO
│   └── repositories/
│       └── student.repository.interface.ts  # NUEVO
```

**Detalles de entidades:**

| Entidad | Campos |
|---------|--------|
| Student | id, course_id, first_name, last_name, document_number, birth_date, tutor_name, tutor_phone, tutor_email, status |

### Application Layer

**Módulo:** `modules/academic/application`

**Archivos a crear:**

```
modules/academic/
├── application/
│   ├── commands/
│   │   ├── create-student/
│   │   ├── update-student/
│   │   ├── delete-student/
│   │   ├── enroll-student/         # Matricular en curso
│   │   └── transfer-student/       # Cambiar de curso
│   ├── queries/
│   │   ├── get-students/
│   │   ├── get-student/
│   │   ├── get-students-by-course/
│   │   ├── get-students-by-grade/  # Por año/división
│   │   └── search-students/       # Buscar por nombre/documento
│   ├── dtos/
│   │   ├── student.request.dto.ts
│   │   ├── student.response.dto.ts
│   │   ├── enrollment.dto.ts
│   │   └── student-filters.dto.ts
│   └── academic.module.ts   # Actualizar
```

### Infrastructure Layer

**Módulo:** `modules/academic/infrastructure`

**Archivos a crear/actualizar:**

```
modules/academic/
├── infrastructure/
│   ├── persistence/
│   │   ├── repositories/
│   │   │   └── student.repository.ts  # NUEVO
│   │   ├── mappers/
│   │   │   └── student.mapper.ts       # NUEVO
│   │   └── academic.persistence.module.ts  # Actualizar
```

### Presentation Layer

**Módulo:** `modules/academic/presentation`

**Archivos a crear/actualizar:**

```
modules/academic/
└── presentation/
    ├── controllers/
    │   └── students.controller.ts    # CRUD /students
    └── academic.presentation.module.ts  # Actualizar
```

**Endpoints:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /students | Listar estudiantes |
| POST | /students | Crear estudiante |
| GET | /students/:id | Obtener estudiante |
| PUT | /students/:id | Actualizar estudiante |
| DELETE | /students/:id | Eliminar estudiante |
| POST | /students/:id/enroll | Matricular en curso |
| GET | /students/course/:courseId | Estudiantes por curso |

---

## Frontend

### Pages

**Archivos a crear:**

```
src/app/
├── (dashboard)/
│   └── students/
│       ├── page.tsx               # /students
│       ├── [id]/
│       │   └── page.tsx          # /students/:id
│       ├── create/
│       │   └── page.tsx          # /students/create
│       └── components/
│           ├── students-list.tsx
│           ├── student-form.tsx
│           ├── student-detail.tsx
│           └── student-filters.tsx
```

### Components

**Archivos a crear:**

```
src/components/
├── features/
│   └── students/
│       ├── students-list.tsx
│       ├── students-table.tsx
│       ├── student-row.tsx
│       ├── student-card.tsx
│       ├── student-form.tsx
│       ├── student-detail.tsx
│       ├── student-filters.tsx
│       └── enrollment-modal.tsx
```

### Hooks

**Archivos a crear:**

```
packages/hooks/
├── src/
│   ├── academic/
│   │   ├── use-students.ts
│   │   ├── use-student.ts
│   │   ├── use-create-student.ts
│   │   ├── use-update-student.ts
│   │   ├── use-delete-student.ts
│   │   ├── use-enroll-student.ts
│   │   ├── use-students-by-course.ts
│   │   └── use-search-students.ts
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
│           ├── student.service.spec.ts
│           └── enrollment.service.spec.ts
```

---

## Tareas por Día

### Día 1: Domain Layer

- [ ] Crear entidad Student
- [ ] Crear StudentService
- [ ] Crear EnrollmentService
- [ ] Definir Value Objects

### Día 2: Application Layer

- [ ] Crear commands de Student CRUD
- [ ] Crear commands de Enrollment
- [ ] Crear queries
- [ ] Crear DTOs

### Día 3: Infrastructure Layer

- [ ] Implementar StudentRepository
- [ ] Crear StudentMapper

### Día 4: Presentation Layer

- [ ] Crear StudentsController
- [ ] Probar con Postman

### Día 5-6: Frontend

- [ ] Crear página /students
- [ ] Crear StudentsTable
- [ ] Crear StudentForm
- [ ] Crear StudentDetail
- [ ] Crear StudentFilters
- [ ] Conectar con API

### Día 7: Integración

- [ ] Test de matriculación
- [ ] Test de búsqueda
- [ ] Verificar filtros por curso

---

## Criterios de Aceptación

- [ ] CRUD de estudiantes funciona
- [ ] Matricular estudiante en curso funciona
- [ ] Datos de tutor se guardan correctamente
- [ ] Búsqueda por nombre/documento funciona
- [ ] Frontend muestra lista de estudiantes
- [ ] Frontend permite crear/editar estudiante

---

## Siguiente Sprint

- Sprint 05: Asistencia Diaria (Primaria)
