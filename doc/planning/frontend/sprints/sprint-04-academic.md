# Sprint 04 — Académico

> **Objetivo:** Implementar la gestión académica: años lectivos, cursos, materias y grilla de horarios. Da el contexto de datos que consumen asistencia (Sprint 05/06) y reportes (Sprint 08).
> **Duración:** 1 semana · **Estimación:** 35 h · **Dependencias:** Sprint 02

---

## Decisiones de diseño

**Admin configura; preceptor/docente consumen.** CRUD de años lectivos, cursos, materias y horarios es de `admin`. `preceptor` ve sus cursos (asignados); `teacher` ve el curso y las materias que dicta.

**Selector de cursos por contexto:** los feature components de asistencia (Sprints 05/06) necesitan "mis cursos" según rol. Se crean hooks reutilizables aquí: `useCourses` (admin: todos), `useMyCourses` (preceptor: asignados) — el backend las expone vía `GET /courses?academicYearId=&level=` filtrando por preceptor en el JWT.

**Grilla de horarios:** componente `schedule-grid` semanal (lun–vie × franjas) coloreado por materia, con modal para crear/editar slots (`POST /schedule` → `set-schedule`).

**Cursos agrupados por año lectivo:** un curso vive dentro de un `academicYear` (`status: active/closed`). El selector de año activo es un hook global `useActiveAcademicYear`.

---

## Resumen de horas

| Área | Horas |
|---|---|
| `@repo/common` — schemas y tipos académicos | 4 |
| `@repo/hooks` — hooks academic | 8 |
| `@repo/ui` — componentes academic | 14 |
| `apps/client` — páginas | 9 |
| **Total** | **35** |

---

## 1. `@repo/common`

- Tipos ya existentes: `IAcademicYearResponse`, `ICourseResponse`, `ISubjectResponse`, `IScheduleSlotResponse`. Verificar contra Swagger.
- Schemas Zod: `academic-year.schema.ts` (fechas, umbrales), `course.schema.ts`, `subject.schema.ts`, `schedule.schema.ts` (slots, validación de solapamiento en cliente).
- Rutas ya existentes: `ACADEMIC_ROUTES` (academicYears, courses, coursePreceptor, subjects, subjectTeacher, schedule). Completar si falta `GET /courses/:id` detail.

---

## 2. `@repo/hooks` — hooks

```
packages/hooks/src/features/academic/
├── use-active-academic-year.ts   # useQuery → año con status active (fallback al primero)
├── use-academic-years.ts         # useQuery → GET /academic-years
├── use-create-academic-year.ts   # useMutation → POST /academic-years
├── use-update-academic-year.ts   # useMutation → PUT /academic-years/:id
├── use-courses.ts                # useQuery → GET /courses?academicYearId=&level=
├── use-course.ts                 # useQuery → GET /courses/:id (incluye subjects + schedule)
├── use-create-course.ts          # useMutation → POST /courses
├── use-update-course.ts          # useMutation → PUT /courses/:id (incl. /preceptor)
├── use-delete-course.ts          # useMutation → DELETE /courses/:id
├── use-subjects.ts               # useQuery → GET /subjects?courseId=
├── use-create-subject.ts         # useMutation → POST /subjects
├── use-update-subject.ts         # useMutation → PUT /subjects/:id (incl. /teacher)
├── use-schedule.ts               # useQuery → GET /schedule?courseId=
└── use-set-schedule.ts           # useMutation → POST /schedule (reemplaza slots)
```

---

## 3. `@repo/ui` — componentes

```
packages/ui/src/components/features/
├── academic/
│   ├── academic-year-form.tsx     # fechas + umbrales + nonWorkingDays
│   ├── academic-year-card.tsx     # año, estado, editar
│   ├── course-form.tsx            # nivel, año (nro), división, turno, preceptor
│   ├── courses-list.tsx           # filtro por nivel/turno
│   ├── course-card.tsx            # nombre completo + métricas básicas
│   └── course-detail.tsx          # info + materias (tabs) + horario
├── subjects/
│   ├── subject-form.tsx           # nombre, área, horas, docente
│   └── subjects-list.tsx          # por curso con actions
└── schedule/
    ├── schedule-grid.tsx          # grilla semanal coloreada por materia
    ├── schedule-form.tsx          # slot: día + hora inicio + hora fin
    └── schedule-modal.tsx         # modal para agregar/editar slot
```

**course-detail** es la vista central que conecta con asistencia y reportes:

```
Tabs: Resumen | Materias | Horario | Estudiantes (Sprint 03) | Asistencia (05/06)
```

---

## 4. `apps/client` — páginas

```
apps/client/src/app/(dashboard)/
├── courses/
│   ├── page.tsx                   # CoursesList (filtro por nivel/turno + AY selector)
│   ├── create/page.tsx            # CourseForm
│   └── [id]/page.tsx              # CourseDetail
└── settings/
    └── academic/page.tsx          # AcademicYearList + form (admin)
```

---

## 5. Tareas por día

### Día 1: Contrato
- [ ] Revisar tipos académicos vs Swagger; completar faltantes
- [ ] Schemas Zod (academic-year, course, subject, schedule)

### Día 2–3: Hooks
- [ ] Hooks de academic-year y curso
- [ ] Hooks de materia y schedule
- [ ] `useActiveAcademicYear` (precarga para Sprints 05/06)

### Día 4–5: Componentes
- [ ] Forms de año lectivo, curso y materia
- [ ] Lists/cards
- [ ] `schedule-grid` + modal

### Día 6: Páginas
- [ ] `/courses`, `/courses/create`, `/courses/[id]`
- [ ] `/settings/academic`

### Día 7: Verificación
- [ ] Flujo: crear AY → crear curso → asignar preceptor → crear materias → configurar horario
- [ ] Validación de solapamiento de horarios en el form
- [ ] `biome check` + `tsc --noEmit`

---

## 6. Criterios de aceptación

- [ ] CRUD de años lectivos, cursos, materias y horarios desde la UI
- [ ] Asignar preceptor y docente con validación de roles
- [ ] Grilla de horarios muestra slots por materia y permite editarlos
- [ ] Preceptor solo ve sus cursos; docente solo sus materias
- [ ] `useActiveAcademicYear` es reutilizado por asistencia/reportes
- [ ] Curso detail conecta a estudiantes, asistencia y reportes

---

**Siguiente sprint →** [Sprint 05: Asistencia Diaria](./sprint-05-attendance-daily.md)
