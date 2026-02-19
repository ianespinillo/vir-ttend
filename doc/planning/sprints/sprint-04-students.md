# Sprint 04 — Gestión de Estudiantes

> **Objetivo:** Implementar gestión completa de estudiantes, matriculación en cursos y datos de tutores.
> **Duración:** 1 semana · **Estimación:** 30 h · **Dependencias:** Sprint 03

---

## Resumen de horas

| Área | Horas |
|---|---|
| Domain Layer | 5 |
| Application Layer | 7 |
| Infrastructure Layer | 4 |
| Presentation Layer | 4 |
| Frontend (UI + hooks + páginas) | 10 |
| **Total** | **30** |

---

## Concepto clave: Estudiantes y matriculación

Un **Student** pertenece a un `Course` (via `courseId`). La matriculación es el acto de asignar un estudiante a un curso. Un estudiante puede ser transferido a otro curso dentro del mismo año académico. El `documentNumber` es único dentro del tenant. Los datos del tutor son opcionales pero importantes para las alertas de Sprint 08.

---

## 1. Domain Layer — `modules/academic/domain` (ampliar)

```
apps/api/src/modules/academic/domain/
├── entities/
│   └── student.entity.ts                   # Aggregate root del estudiante
├── value-objects/
│   ├── student-id.value-object.ts          # UUID tipado
│   └── document-number.value-object.ts     # DNI/documento — valida formato, normaliza sin puntos
├── services/
│   ├── student.service.ts                  # fullName(): string, age(): number
│   └── enrollment.service.ts              # validateEnrollment(student, course): void
│                                           # → lanza si el curso está en otro tenant
│                                           # → lanza si el estudiante ya está activo en ese curso
└── repositories/
    └── student.repository.interface.ts     # findById, findByCourse, findByDocument, search, save, delete
```

### Esquema de entidad

| Entidad | Campos |
|---|---|
| `Student` | `id`, `courseId`, `tenantId`, `firstName`, `lastName`, `documentNumber`, `birthDate`, `tutorName`, `tutorPhone`, `tutorEmail` (nullable), `status` (active/inactive/transferred), `createdAt` |

### `student.entity.ts` — comportamiento de dominio

```ts
// fullName(): string → `${lastName}, ${firstName}`
// age(): number → calculado desde birthDate
// isActive(): boolean → status === 'active'
// transfer(newCourseId: CourseId): void → actualiza courseId y status
```

---

## 2. Application Layer — `modules/academic/application` (ampliar)

```
apps/api/src/modules/academic/application/
├── commands/
│   ├── create-student/
│   │   ├── create-student.command.ts       # { courseId, firstName, lastName, documentNumber, birthDate, tutor* }
│   │   └── create-student.handler.ts       # valida unicidad de documentNumber en el tenant, crea Student
│   ├── update-student/
│   │   ├── update-student.command.ts       # { studentId, firstName?, lastName?, tutorName?, tutorPhone?, tutorEmail? }
│   │   └── update-student.handler.ts
│   ├── delete-student/
│   │   ├── delete-student.command.ts       # { studentId }
│   │   └── delete-student.handler.ts       # soft delete: status = 'inactive'
│   ├── enroll-student/
│   │   ├── enroll-student.command.ts       # { studentId, courseId }
│   │   └── enroll-student.handler.ts       # usa EnrollmentService para validar, actualiza courseId
│   └── transfer-student/
│       ├── transfer-student.command.ts     # { studentId, newCourseId, reason? }
│       └── transfer-student.handler.ts     # cambia courseId, registra historial (futuro)
├── queries/
│   ├── get-student/
│   │   ├── get-student.query.ts            # { studentId }
│   │   └── get-student.handler.ts          # retorna StudentDetailResponseDto
│   ├── get-students-by-course/
│   │   ├── get-students-by-course.query.ts # { courseId, status?: 'active' | 'all' }
│   │   └── get-students-by-course.handler.ts # por defecto solo activos, ordenados por apellido
│   ├── search-students/
│   │   ├── search-students.query.ts        # { tenantId, query: string, page, limit }
│   │   └── search-students.handler.ts      # busca en firstName, lastName y documentNumber (ILIKE)
│   └── get-students-by-grade/
│       ├── get-students-by-grade.query.ts  # { academicYearId, yearNumber, level }
│       └── get-students-by-grade.handler.ts # lista estudiantes de todos los cursos del mismo año/nivel
├── dtos/
│   ├── create-student.request.dto.ts       # todos los campos con validaciones (IsString, IsDate, IsOptional)
│   ├── update-student.request.dto.ts       # todos opcionales
│   ├── student.response.dto.ts             # id, fullName, documentNumber, birthDate, age, courseId, status
│   ├── student-detail.response.dto.ts     # extiende student.response + tutor info + courseName
│   ├── student-filters.dto.ts             # query?, status?, page, limit
│   └── enroll-student.request.dto.ts      # courseId
└── academic.module.ts                      # actualizar: registrar nuevos commands y queries
```

---

## 3. Infrastructure Layer — `modules/academic/infrastructure` (ampliar)

```
apps/api/src/modules/academic/infrastructure/
├── persistence/
│   ├── entities/
│   │   └── student.orm-entity.ts           # @Entity() Student con @Index en document_number + tenant_id
│   ├── repositories/
│   │   └── student.repository.ts           # implementa IStudentRepository
│   │                                       # findByCourse filtra por TenantContextService automáticamente
│   │                                       # search usa qb.where('first_name ILIKE :q OR last_name ILIKE :q')
│   ├── mappers/
│   │   └── student.mapper.ts               # StudentOrmEntity ↔ Student (dominio)
│   └── academic.persistence.module.ts     # actualizar: agregar StudentOrmEntity y StudentRepository
```

### Migración a generar

```bash
pnpm mikro-orm migration:create --name=create_students
```

Tabla:
- `students` (id, course_id, tenant_id, first_name, last_name, document_number, birth_date, tutor_name, tutor_phone, tutor_email, status, created_at, updated_at)
- Índice único: `(tenant_id, document_number)`
- Índice: `(course_id)` para consultas frecuentes

---

## 4. Presentation Layer — `modules/academic/presentation` (ampliar)

```
apps/api/src/modules/academic/presentation/
├── controllers/
│   └── students.controller.ts              # CRUD /students + POST /students/:id/enroll
└── academic.presentation.module.ts        # actualizar: registrar StudentsController
```

### Endpoints

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| `GET` | `/students?courseId=&status=&page=&limit=` | `admin`, `preceptor` | Listar estudiantes del curso |
| `POST` | `/students` | `admin`, `preceptor` | Crear estudiante |
| `GET` | `/students/search?q=` | `admin`, `preceptor` | Buscar por nombre o documento |
| `GET` | `/students/:id` | `admin`, `preceptor` | Obtener estudiante con datos de tutor |
| `PUT` | `/students/:id` | `admin`, `preceptor` | Actualizar datos del estudiante |
| `DELETE` | `/students/:id` | `admin` | Desactivar estudiante (soft delete) |
| `POST` | `/students/:id/enroll` | `admin` | Matricular en un curso |
| `POST` | `/students/:id/transfer` | `admin` | Transferir a otro curso |

---

## 5. Frontend

### 5.1 `packages/ui` — componentes nuevos

```
packages/ui/src/components/features/students/
├── students-table.tsx                      # Tabla con columnas: apellido, nombre, documento, estado
│                                           # Props: students[], onEdit, onView, onDelete
│                                           # Incluye paginación y buscador inline
├── student-form.tsx                        # Formulario de creación/edición
│                                           # Secciones: datos personales, tutor
│                                           # Props: onSubmit, isLoading, defaultValues?, courses[]
├── student-detail.tsx                      # Vista completa del estudiante
│                                           # Tabs: Datos personales | Tutor | Asistencia (link a Sprint 05)
│                                           # Props: student: StudentDetailResponseDto
├── student-card.tsx                        # Card compacta para vistas de lista
│                                           # Props: student, onClick
├── student-filters.tsx                     # Filtros: búsqueda, estado, curso
│                                           # Props: onFilter, initialValues?
├── enrollment-modal.tsx                   # Modal para matricular o transferir a otro curso
│                                           # Props: student, courses[], onEnroll, isOpen, onClose
└── tutor-info.tsx                          # Bloque de información del tutor (read-only)
                                            # Props: tutorName, tutorPhone, tutorEmail?
```

### 5.2 `packages/hooks` — hooks nuevos

> **Patrón:** todos los hooks importan `apiClient` de `../lib/axios-client` (interno de `packages/hooks`) y las rutas de `@vir-ttend/common`. Ningún hook hardcodea URLs ni importa axios directamente.

```
packages/hooks/src/
├── academic/
│   ├── use-students.ts                     # useQuery → apiClient.get(students?courseId=&status=&page=&limit=
│   ├── use-student.ts                      # useQuery → apiClient.get(students/:id
│   ├── use-search-students.ts             # useQuery con debounce → GET /students/search?q=
│   ├── use-create-student.ts              # useMutation → apiClient.post(students
│   ├── use-update-student.ts              # useMutation → apiClient.put(students/:id
│   ├── use-delete-student.ts              # useMutation → apiClient.delete(students/:id
│   ├── use-enroll-student.ts              # useMutation → apiClient.post(students/:id/enroll
│   └── use-transfer-student.ts            # useMutation → apiClient.post(students/:id/transfer
└── index.ts                               # actualizar re-exports
```

### 5.3 `apps/client` — páginas

```
apps/client/src/app/(dashboard)/
└── students/
    ├── page.tsx                            # Importa StudentsTable y StudentFilters de @vir-ttend/ui
    │                                       # Usa useStudents, useSearchStudents
    │                                       # Parámetro courseId del query string
    ├── create/
    │   └── page.tsx                        # Importa StudentForm de @vir-ttend/ui
    │                                       # Usa useCreateStudent, useCourses
    └── [id]/
        └── page.tsx                        # Importa StudentDetail de @vir-ttend/ui
                                            # Usa useStudent, useUpdateStudent, useEnrollStudent
```

---

## 6. Testing

```
apps/api/test/unit/academic/
├── student.service.spec.ts                # fullName, age, isActive
├── enrollment.service.spec.ts             # validateEnrollment con casos válidos e inválidos
├── create-student.handler.spec.ts         # mock repo, verificar unicidad de documento
└── transfer-student.handler.spec.ts       # verificar cambio de courseId
```

---

## 7. Tareas por día

### Día 1: Domain Layer
- [ ] Crear entidad `Student`
- [ ] Crear Value Objects: `StudentIdVO`, `DocumentNumberVO`
- [ ] Implementar `StudentService` y `EnrollmentService`
- [ ] Definir `IStudentRepository`

### Día 2: Application Layer — commands
- [ ] `CreateStudentCommand` + handler (con validación de documento único)
- [ ] `UpdateStudentCommand` + handler
- [ ] `EnrollStudentCommand` + handler
- [ ] `TransferStudentCommand` + handler
- [ ] `DeleteStudentCommand` + handler (soft delete)

### Día 3: Application Layer — queries + DTOs
- [ ] Queries: GetStudent, GetStudentsByCourse, SearchStudents, GetStudentsByGrade
- [ ] Todos los DTOs

### Día 4: Infrastructure + Presentation
- [ ] ORM entity con índices
- [ ] `StudentRepository` con búsqueda ILIKE
- [ ] `StudentMapper`
- [ ] Generar y ejecutar migración
- [ ] `StudentsController` con todos los endpoints
- [ ] Probar con Postman

### Día 5–6: Frontend
- [ ] Componentes en `packages/ui`
- [ ] Hooks en `packages/hooks`
- [ ] Páginas en `apps/client`
- [ ] Conectar búsqueda con debounce

### Día 7: Integración y tests
- [ ] Test de unicidad de documento por tenant
- [ ] Test de matrícula y transferencia
- [ ] Tests unitarios

---

## 8. Criterios de aceptación

- [ ] CRUD de estudiantes funciona
- [ ] Búsqueda por nombre y documento funciona (case-insensitive)
- [ ] Matrícula en curso funciona con validaciones
- [ ] Transferencia a otro curso actualiza `courseId` y `status`
- [ ] Datos de tutor se guardan y se muestran correctamente
- [ ] `documentNumber` es único por tenant (error 409 si duplicado)
- [ ] Soft delete desactiva sin borrar el registro
- [ ] Tabla en frontend muestra paginación y permite buscar

---

**Siguiente sprint →** Sprint 05: Asistencia Diaria (Primaria)
