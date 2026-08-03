# Sprint 08 — Reportes y Exportación

> **Objetivo:** Implementar los reportes: mensual por curso, por alumno, semáforo de riesgo y exportación a Excel/PDF.
> **Duración:** 1 semana · **Estimación:** 30 h · **Dependencias:** Sprint 07

---

## Decisiones de diseño

**`admin` genera reportes globales; preceptor y docente los ven de su ámbito** (curso/asignatura propia). El backend ya filtra por rol en `GET /reports/...`; el front solo navega según permisos.

**Reporte mensual por curso:** `GET /reports/monthly?academicYearId=&courseId=&month=` con `nonWorkingDays` por día, estado por alumno y semáforo. Se renderiza como tabla + `attendance-trend-chart` (recharts, ya instalado).

**Exportación server-side:** botón "Exportar Excel" y "Exportar PDF" → `GET /export/attendance/:courseId/:month?format=xlsx|pdf` en una pestaña nueva (blob link). Los links viven en `EXPORT_ROUTES` de `@repo/common`.

**Reporte por alumno:** desde `StudentDetail` (Sprint 03) tab "Reporte" → `GET /reports/student/:studentId?from=&to=` con historial por materia y justificaciones.

---

## Resumen de horas

| Área | Horas |
|---|---|
| `@repo/common` — tipos reportes/export | 3 |
| `@repo/hooks` — hooks reportes | 7 |
| `@repo/ui` — componentes reportes | 12 |
| `apps/client` — páginas | 8 |
| **Total** | **30** |

---

## 1. `@repo/common`

- Tipos (Sprint 00): `MonthlyReportResponse`, `StudentReportResponse`, `RiskSummaryResponse`. Verificar contra Swagger.
- Rutas: `REPORTS_ROUTES` (monthly, student, risk, export y sus variantes). `EXPORT_ROUTES` con `format` param.

---

## 2. `@repo/hooks` — hooks

```
packages/hooks/src/features/reports/
├── use-monthly-report.ts      # useQuery → GET /reports/monthly?academicYearId=&courseId=&month=
├── use-student-report.ts      # useQuery → GET /reports/student/:studentId?from=&to=
├── use-risk-summary.ts        # useQuery → GET /reports/risk?academicYearId=&courseId=
├── use-export-attendance.ts   # useMutation → GET /export/attendance/:courseId/:month?format=
│                              # responseType blob → descarga; onError → toast
└── use-export-report.ts       # useMutation → GET /export/report/:courseId/:month?format=
```

**`use-export-attendance` (esquema):**

```tsx
const download = await exportAttendance.mutateAsync({ courseId, month, format: 'xlsx' });
const url = URL.createObjectURL(download);
window.open(url, '_blank');
```

---

## 3. `@repo/ui` — componentes

```
packages/ui/src/components/features/reports/
├── monthly-report/
│   ├── report-filters.tsx          # AY + curso + mes (según rol)
│   ├── monthly-report-table.tsx    # fila por alumno, columnas por día, semáforo
│   ├── report-status-cell.tsx      # color por estado (P/A/L/J) con tooltip
│   ├── export-actions.tsx          # botones Excel/PDF (blob download)
│   └── monthly-report.tsx          # composición: Filters + Summary + Table + Chart
├── student-report/
│   ├── student-report.tsx          # por materia + justificaciones + % total
│   └── subject-progress-bars.tsx   # barras de asistencia por materia
├── risk/
│   ├── risk-summary.tsx            # cards de alumnos en riesgo
│   └── risk-table.tsx              # semáforo + acciones (→ detalle alumno)
└── shared/
    └── export-button.tsx           # botón genérico Excel/PDF con loading
```

---

## 4. `apps/client` — páginas

```
apps/client/src/app/(dashboard)/
├── reports/
│   ├── page.tsx                    # redirect → /reports/monthly
│   └── monthly/page.tsx            # MonthlyReport (filtros + tabla + export)
└── students/[id]/report/page.tsx   # StudentReport (o tab dentro de StudentDetail)
```

**Integración con `student-detail` (Sprint 03):** tab "Reporte" con `StudentReport`.

---

## 5. Tareas por día

### Día 1: Contrato + hooks lectura
- [ ] Verificar tipos reportes vs Swagger; completar `REPORTS_ROUTES`
- [ ] `use-monthly-report`, `use-student-report`, `use-risk-summary`

### Día 2: Export
- [ ] `EXPORT_ROUTES` + `use-export-attendance`, `use-export-report`
- [ ] Manejo de blob y errores (download inválido → toast)

### Día 3–4: Componentes monthly
- [ ] `report-filters`, `monthly-report-table`, `report-status-cell`
- [ ] `export-actions`, `monthly-report`

### Día 5: Student report + risk
- [ ] `student-report`, `subject-progress-bars`
- [ ] `risk-summary`, `risk-table`

### Día 6: Páginas
- [ ] `/reports/monthly`, `/reports` redirect
- [ ] Tab "Reporte" en `StudentDetail`

### Día 7: Verificación
- [ ] Export real descarga xlsx y pdf
- [ ] Semáforo coincide con umbrales
- [ ] `biome check` + `tsc --noEmit`

---

## 6. Criterios de aceptación

- [ ] Reporte mensual por curso: filas por alumno, columnas por día, semáforo
- [ ] Reporte por alumno con historial por materia y justificaciones
- [ ] Export Excel y PDF descarga archivo real desde `/export`
- [ ] Filtros según rol (admin todo, preceptor sus cursos, docente su materia)
- [ ] Semáforo usa `ATTENDANCE_THRESHOLDS`
- [ ] `apps/client` no llama a `/export` fuera de los hooks

---

**Siguiente sprint →** [Sprint 09: Comunicados](./sprint-09-announcements.md)
