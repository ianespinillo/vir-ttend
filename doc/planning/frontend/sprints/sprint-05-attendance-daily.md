# Sprint 05 — Asistencia Diaria (Primaria)

> **Objetivo:** Implementar el panel del preceptor para registrar la asistencia diaria de primaria: grilla de alumnos, cambios de estado, quick actions ("todos presentes/ausentes"), justificaciones y métricas del día.
> **Duración:** 1 semana · **Estimación:** 35 h · **Dependencias:** Sprint 03, Sprint 04

---

## Decisiones de diseño

**Un panel, dos modos:** la misma composición de toolbar + grilla + métricas sirve para primaria (este sprint) y para secundaria por materia (Sprint 06). El discriminador es el `level` del curso: primaria → `subjectId = null`, secundaria → selector de materia.

**Estados:** `present | absent | late | justified` (constantes `ATTENDANCE_STATUS` en `@repo/common`). Colores por estado.

**Actualización optimista:** al cambiar un estado se hace `setQueryData` local e `invalidateQueries`; el registro es bulk (`POST /attendance/daily` con `records[]`), así que el autosave de la grilla se dispara al cambiar cada celda con debounce.

**Fecha = estado compartido de la página** (URL: `?courseId=&date=`). El date-picker solo permite días hábiles del año activo.

**Justificación:** modal en una fila con estado `absent`/`late` → `POST /attendance/:id/justify` → cambia a `justified`.

---

## Resumen de horas

| Área | Horas |
|---|---|
| `@repo/common` — tipos y schema de asistencia diaria | 3 |
| `@repo/hooks` — hooks attendance (diaria) | 8 |
| `@repo/ui` — componentes attendance | 14 |
| `apps/client` — páginas | 10 |
| **Total** | **35** |

---

## 1. `@repo/common`

- Tipos (Sprint 00): `AttendanceRecordResponse`, `DailyAttendanceResponse`, `AttendanceMetrics`. Verificar contra Swagger.
- `attendance.schema.ts`: `attendanceStatusSchema`, `registerDailySchema`.
- `ATTENDANCE_STATUS` y `ATTENDANCE_THRESHOLDS` ya existen en `constants/` (revisar nombre exacto de la const exportada y usar en badges/semáforo).

---

## 2. `@repo/hooks` — hooks (diaria)

```
packages/hooks/src/features/attendance/
├── use-daily-attendance.ts          # useQuery → GET /attendance/daily?courseId=&date=
│                                    # queryKey: queryKeys.attendance.daily(courseId, date)
├── use-attendance-metrics.ts        # useQuery → GET /attendance/metrics?courseId=&date=
├── use-register-daily-attendance.ts # useMutation → POST /attendance/daily (bulk)
│                                    # onSuccess: invalida daily + metrics
├── use-bulk-attendance.ts           # useMutation → POST /attendance/daily/all
├── use-justify-attendance.ts        # useMutation → POST /attendance/:id/justify
└── use-attendance-history.ts        # useQuery → GET /attendance/student/:studentId
```

---

## 3. `@repo/ui` — componentes

```
packages/ui/src/components/features/attendance/
├── attendance-toolbar/
│   ├── course-selector.tsx        # cursos según rol (preceptor: los suyos)
│   ├── date-picker.tsx            # solo días hábiles del AY activo
│   ├── quick-actions.tsx          # "Todos presentes" / "Todos ausentes"
│   └── attendance-toolbar.tsx     # composición (con slot para SubjectSelector en 06)
├── attendance-grid/
│   ├── attendance-grid.tsx        # filas de alumnos + selector de estado
│   ├── attendance-row.tsx         # alumno: nombre + status select + justificar
│   └── attendance-status-select.tsx # Select con los 4 estados coloreados
├── attendance-summary/
│   ├── metric-card.tsx            # icono + número + label
│   └── attendance-summary.tsx     # totales del día (present, absent, late, justified, %)
├── justification-modal/
│   └── justification-modal.tsx    # razón + notas → useJustifyAttendance
└── daily-attendance-page.tsx      # composición: Toolbar + Summary + Grid
```

**Autosave optimista (esquema del grid):**

```
onStatusChange(studentId, status)
  → setQueryData(daily, ...)               // update local inmediato
  → useRegisterDailyAttendance.mutate({ courseId, date, records: pending })
  → onSuccess → invalidateQueries(daily, metrics)
```

---

## 4. `apps/client` — páginas

```
apps/client/src/app/(dashboard)/attendance/
├── page.tsx                      # redirect → /attendance/daily
└── daily/page.tsx                # DailyAttendancePage (useDailyAttendance, useMetrics,
                                  #   useRegisterDaily, useBulk, useJustify, useMyCourses)
```

---

## 5. Tareas por día

### Día 1: Contrato + hooks base
- [ ] Verificar tipos attendance vs Swagger
- [ ] `use-daily-attendance`, `use-attendance-metrics`

### Día 2: Hooks de escritura
- [ ] `use-register-daily-attendance` (bulk), `use-bulk-attendance`, `use-justify-attendance`
- [ ] Invalidaciones correctas

### Día 3–4: Componentes
- [ ] `attendance-toolbar` (course selector, date picker, quick actions)
- [ ] `attendance-grid` + `attendance-status-select` + `attendance-row`
- [ ] `attendance-summary` + `metric-card`

### Día 5: Justificación + página
- [ ] `justification-modal`
- [ ] `daily-attendance-page` (composición) y `/attendance/daily`

### Día 6: Optimistic updates + edge cases
- [ ] Autosave con debounce y rollback ante error
- [ ] Alumno sin registro → status null editable

### Día 7: Verificación
- [ ] Flujo completo: elegir curso → marcar → justificar → métricas
- [ ] Quick actions en un click
- [ ] `biome check` + `tsc --noEmit`

---

## 6. Criterios de aceptación

- [ ] Preceptor registra asistencia de todos los alumnos de un curso en un día
- [ ] "Marcar todos presentes/ausentes" funciona en un click
- [ ] Editar un estado ya registrado actualiza (no duplica) el registro
- [ ] Justificación cambia `absent`/`late` → `justified`
- [ ] Métricas del día correctas (%, en riesgo)
- [ ] Cambios se reflejan con optimistic update y rollback ante error
- [ ] `teacher` no ve este panel

---

**Siguiente sprint →** [Sprint 06: Asistencia por Materia](./sprint-06-attendance-subject.md)
