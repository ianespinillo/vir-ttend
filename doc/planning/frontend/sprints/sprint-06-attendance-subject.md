# Sprint 06 — Asistencia por Materia (Secundaria)

> **Objetivo:** Extender el panel de asistencia para secundaria: registro por materia, selector de materias según el día del horario, copiar asistencia de la clase anterior y visualización de tardanzas con la política del año lectivo.
> **Duración:** 1 semana · **Estimación:** 30 h · **Dependencias:** Sprint 03, Sprint 04

---

## Decisiones de diseño

**Docente protagonista:** `/attendance/subject` es la home del rol `teacher`. Usa `GET /attendance/teacher/subjects` (solo sus materias) para poblar el `SubjectSelector`.

**Filtro por día del horario:** el `SubjectSelector` solo muestra materias que tienen clase el día seleccionado (según `GET /schedule?courseId=`). Si la fecha no es día de clase de la materia seleccionada, se bloquea el registro.

**Copiar asistencia:** `POST /attendance/subject/copy` con `sourceDate` opcional (null = clase más reciente). El modal muestra la fecha fuente y el conteo antes de confirmar. No sobreescribe registros existentes.

**Tardanzas:** `late` se muestra con su badge; el backend aplica la política (`lateCountsAsAbsenceAfterMinutes`) al calcular porcentajes. El front solo muestra el estado y una tooltip explicativa.

**Reuso de la composición de Sprint 05:** `attendance-toolbar` gana un slot para `SubjectSelector`; la grilla es la misma pero con contexto de materia (`subjectId`).

---

## Resumen de horas

| Área | Horas |
|---|---|
| `@repo/common` — tipos/schema subject attendance | 3 |
| `@repo/hooks` — hooks por materia | 7 |
| `@repo/ui` — componentes subject + reuso | 12 |
| `apps/client` — páginas y home del teacher | 8 |
| **Total** | **30** |

---

## 1. `@repo/common`

- Tipos: `SubjectAttendanceResponse` (daily + subjectId/subjectName), `SubjectHistoryResponse`.
- Schema: `registerSubjectAttendanceSchema`.
- Rutas ya existentes en `ATTENDANCE_ROUTES`: `subject`, `subjectAll`, `subjectCopy`, `subjectHistory`, `teacherSubjects`.

---

## 2. `@repo/hooks` — hooks (por materia)

```
packages/hooks/src/features/attendance/
├── use-teacher-subjects.ts      # useQuery → GET /attendance/teacher/subjects?academicYearId=
├── use-subject-attendance.ts    # useQuery → GET /attendance/subject?subjectId=&date=
├── use-register-subject-attendance.ts # useMutation → POST /attendance/subject
├── use-copy-attendance.ts       # useMutation → POST /attendance/subject/copy
├── use-bulk-subject-attendance.ts    # useMutation → POST /attendance/subject/all
└── use-subject-history.ts       # useQuery → GET /attendance/subject/:subjectId/history?from=&to=
```

---

## 3. `@repo/ui` — componentes

```
packages/ui/src/components/features/attendance/
├── subject-selector.tsx          # Dropdown de materias del docente filtradas por día
│                                 # Props: subjects, value, onChange, disabledDays?
├── subject-attendance-grid.tsx   # reusa AttendanceGrid con subjectId en el contexto
├── copy-attendance-modal.tsx     # fecha fuente + conteo de alumnos a copiar + confirmación
├── late-badge.tsx                # badge/tooltip de tardanza (explica política del AY)
├── subject-attendance-page.tsx   # Toolbar(con SubjectSelector) + Summary + Grid + CopyModal
└── index.ts
```

**Actualización a `attendance-toolbar` (Sprint 05):**

```
attendance-toolbar.tsx
  + Props: subjects?, selectedSubjectId?, onSubjectChange?
  + Renderiza <SubjectSelector/> cuando level === 'secondary'
```

---

## 4. `apps/client` — páginas

```
apps/client/src/app/(dashboard)/attendance/
└── subject/page.tsx              # SubjectAttendancePage
                                  # useTeacherSubjects, useSubjectAttendance,
                                  # useRegisterSubjectAttendance, useCopyAttendance
```

**Home del teacher** (`(dashboard)/page.tsx` de Sprint 02) apunta a `/attendance/subject`.

---

## 5. Tareas por día

### Día 1: Contrato + hooks de lectura
- [ ] Verificar tipos subject attendance vs Swagger
- [ ] `use-teacher-subjects`, `use-subject-attendance`, `use-subject-history`

### Día 2: Hooks de escritura
- [ ] `use-register-subject-attendance`, `use-bulk-subject-attendance`, `use-copy-attendance`

### Día 3–4: Componentes
- [ ] `subject-selector` (filtrado por día del horario)
- [ ] `subject-attendance-grid` (reuso)
- [ ] `copy-attendance-modal`

### Día 5: Integración del toolbar + página
- [ ] Slot `SubjectSelector` en `attendance-toolbar`
- [ ] `subject-attendance-page` + `/attendance/subject`

### Día 6: Edge cases
- [ ] Bloquear registro en fecha sin clase de la materia
- [ ] Copiar sin sobreescribir (conteo previo)
- [ ] Tardanza con tooltip

### Día 7: Verificación
- [ ] Flujo docente: elegir materia → registrar → copiar de clase anterior
- [ ] `biome check` + `tsc --noEmit`

---

## 6. Criterios de aceptación

- [ ] Docente registra asistencia por materia con `subjectId` presente
- [ ] El selector de materias filtra por día del horario
- [ ] Se bloquea registrar en fecha que no es día de clase de la materia
- [ ] Copiar asistencia de la clase anterior funciona y no sobreescribe
- [ ] El modal de copia muestra fecha fuente y conteo antes de confirmar
- [ ] `late` se muestra con badge y tooltip de la política del AY
- [ ] `GET /attendance/teacher/subjects` solo retorna materias del docente autenticado

---

**Siguiente sprint →** [Sprint 07: Panel de Preceptoría + Alertas](./sprint-07-preceptor-dashboard-alerts.md)
