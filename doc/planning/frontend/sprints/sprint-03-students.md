# Sprint 03 — Estudiantes

> **Objetivo:** Implementar la gestión de estudiantes: listado con filtros y paginación, búsqueda con debounce, creación/edición, detalle con datos del tutor, matriculación y transferencia entre cursos.
> **Duración:** 1 semana · **Estimación:** 30 h · **Dependencias:** Sprint 02

---

## Decisiones de diseño

**Roles:** `admin` y `preceptor` pueden listar/crear/editar. `admin` además matricula, transfiere y desactiva. `teacher` no accede (salvo ver alumnos de su curso vía detalle de curso en Sprint 04).

**Búsqueda con debounce:** `useSearchStudents` (query key con `q`) dispara con 300 ms. La página usa `useDeferredValue` para no re-renderar de más.

**Paginación y filtros en la URL** (`?courseId=&status=&page=`): el listado es compartible y persistente.

**Optimistic updates** en `useDeleteStudent` (soft delete) para feedback inmediato.

---

## Resumen de horas

| Área | Horas |
|---|---|
| `@repo/common` — schemas y tipos de student | 3 |
| `@repo/hooks` — hooks de students | 7 |
| `@repo/ui` — componentes de students | 12 |
| `apps/client` — páginas | 8 |
| **Total** | **30** |

---

## 1. `@repo/common`

- Ya existe `IStudentResponse`, `IStudentDetailResponse` (verificar campos vs API).
- Completar `student.schema.ts` (Sprint 00 ya lo creó): `createStudentSchema`, `updateStudentSchema`, `enrollSchema`.
- Verificar `STUDENT_ROUTES` cubre: list, search, get, create, update, delete (soft), enroll, transfer. (La API no expone `DELETE /students/:id` como hard — el delete es `status=inactive` vía PUT; confirmar en Swagger y ajustar ruta si hace falta.)

---

## 2. `@repo/hooks` — hooks

```
packages/hooks/src/features/students/
├── use-students.ts          # useQuery → GET /students?courseId=&status=&page=&limit=
│                             # queryKey: queryKeys.students.list({courseId,status,page})
├── use-student.ts           # useQuery → GET /students/:id
├── use-search-students.ts   # useQuery con debounce → GET /students/search?q=
├── use-create-student.ts    # useMutation → POST /students (invalida students.list)
├── use-update-student.ts    # useMutation → PUT /students/:id
├── use-delete-student.ts    # useMutation → (soft delete) invalida list
├── use-enroll-student.ts    # useMutation → POST /students/:id/enroll
└── use-transfer-student.ts  # useMutation → POST /students/:id/transfer
```

---

## 3. `@repo/ui` — componentes

```
packages/ui/src/components/features/students/
├── students-page.tsx          # Composición: Filters + Table + paginación + actions
│                              # Props: courseId?, onView, onCreate
├── student-filters.tsx        # Filtros: búsqueda (debounce), curso (Select), estado
│                              # Props: value, onChange (serializa a URL)
├── students-table.tsx         # usa DataTable shared: apellido, nombre, documento, curso, estado
├── student-form.tsx           # RHF + zod. Secciones: datos personales + tutor
│                              # Props: onSubmit, isLoading, defaultValues?, courses[]
├── student-detail.tsx         # Tabs: Datos personales | Tutor | Asistencia (link a Sprint 05)
├── enrollment-modal.tsx       # Matricular/transferir: Select de curso + submit
└── tutor-info.tsx             # Bloque read-only del tutor
```

**Form (student-form) — esquema:**

```tsx
const form = useForm({
  resolver: zodResolver(createStudentSchema),
  defaultValues: { firstName: '', lastName: '', documentNumber: '', birthDate: '', tutorName: '', tutorPhone: '', tutorEmail: '', courseId: '' },
});
```

---

## 4. `apps/client` — páginas

```
apps/client/src/app/(dashboard)/students/
├── page.tsx                   # StudentsPage (lee query params, useStudents)
├── create/page.tsx            # StudentForm + useCreateStudent → back a /students
└── [id]/page.tsx              # StudentDetail + useStudent, useUpdateStudent,
                               #   useEnrollStudent, useTransferStudent, useStudentAlerts (Sprint 07)
```

---

## 5. Tareas por día

### Día 1: Contrato
- [ ] Revisar tipos `IStudentResponse`/`IStudentDetailResponse` contra Swagger
- [ ] Completar `student.schema.ts`
- [ ] Verificar `STUDENT_ROUTES` (delete/soft)

### Día 2–3: Hooks
- [ ] `use-students`, `use-student`, `use-search-students` (debounce)
- [ ] `use-create-student`, `use-update-student`, `use-delete-student`
- [ ] `use-enroll-student`, `use-transfer-student`
- [ ] Invalidación de query keys correcta

### Día 4–5: Componentes
- [ ] `student-filters` (debounce + URL)
- [ ] `students-table` sobre `DataTable`
- [ ] `student-form` (validación zod, sección tutor)
- [ ] `student-detail` con tabs

### Día 6: Páginas e integración
- [ ] `/students`, `/students/create`, `/students/[id]`
- [ ] Matrícula/transferencia desde el detalle

### Día 7: Verificación
- [ ] Test de búsqueda con debounce
- [ ] Test de optimistic delete
- [ ] `biome check` + `tsc --noEmit` en verde

---

## 6. Criterios de aceptación

- [ ] Listado con paginación, filtro por curso y estado, y búsqueda por nombre/documento
- [ ] Crear y editar estudiante con validación de documento (error 409 mapeado)
- [ ] Detalle muestra tutor y navega a asistencia
- [ ] Matricular y transferir cambian curso y actualizan la UI
- [ ] Desactivar (soft delete) quita el estudiante del listado activo
- [ ] Filtros y paginación viven en la URL
- [ ] Roles: preceptor puede operar; solo admin matricula/transfiere/desactiva

---

**Siguiente sprint →** [Sprint 04: Académico](./sprint-04-academic.md)
