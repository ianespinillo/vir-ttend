# Sprint 07 — Panel de Preceptoría + Alertas

> **Objetivo:** Implementar el dashboard del preceptor con semáforo por curso, auto-refresh, y el centro de alertas con badge de no vistas.
> **Duración:** 1 semana · **Estimación:** 30 h · **Dependencias:** Sprint 05, Sprint 06

---

## Decisiones de diseño

**Dashboard 100% lectura:** cards de cursos con semáforo (`green` < WARNING, `yellow` < CRITICAL, `red` ≥ CRITICAL), `notRecorded` visible. Auto-refresh con polling de 30 s (`refetchInterval` de TanStack Query; se pausa con tab en background automáticamente).

**Alertas dirigidas por eventos en backend:** el front solo consume. Tres consultas: lista, no vistas y contador. El badge del topbar usa `useAlertsCount` con polling de 60 s.

**Navegación del dashboard → asistencia:** click en una card de curso → `/attendance/daily?courseId=&date=`. Click en una alerta → detalle del alumno con historial de alertas.

**Semáforo y umbrales:** `ATTENDANCE_THRESHOLDS` (WARNING/CRITICAL) ya viven en `@repo/common`. Los umbrales de alerta (warning/critical/exceeded) los define el backend en `AlertType`.

---

## Resumen de horas

| Área | Horas |
|---|---|
| `@repo/common` — tipos dashboard/alerts | 3 |
| `@repo/hooks` — hooks dashboard/alerts | 7 |
| `@repo/ui` — componentes dashboard + alerts | 12 |
| `apps/client` — páginas + integración topbar | 8 |
| **Total** | **30** |

---

## 1. `@repo/common`

- Tipos (Sprint 00): `CourseSnapshot`, `PreceptorDashboardResponse`, `DashboardMetricsResponse`, `AlertResponse`, `AlertsCountResponse`. Verificar contra Swagger.
- Constantes: `ATTENDANCE_THRESHOLDS` (WARNING 75, CRITICAL 85). `AlertType` como unión `'warning' | 'critical' | 'exceeded'`.

---

## 2. `@repo/hooks` — hooks

```
packages/hooks/src/features/
├── dashboard/
│   ├── use-preceptor-dashboard.ts   # useQuery → GET /dashboard?date=
│   │                                # refetchInterval: 30_000
│   ├── use-course-overview.ts       # useQuery → GET /dashboard/course/:courseId?date=
│   └── use-dashboard-metrics.ts     # useQuery → GET /dashboard/metrics?academicYearId=
└── alerts/
    ├── use-alerts.ts                # useQuery → GET /alerts?courseId=&alertType=&page=
    ├── use-unseen-alerts.ts         # useQuery → GET /alerts/unseen
    ├── use-alerts-count.ts          # useQuery → GET /alerts/count (refetchInterval 60_000)
    ├── use-mark-alert-seen.ts       # useMutation → PATCH /alerts/:id/seen
    │                                # onSuccess: invalida count + unseen + list
    └── use-student-alerts.ts        # useQuery → GET /alerts/student/:studentId
```

---

## 3. `@repo/ui` — componentes

```
packages/ui/src/components/features/
├── dashboard/
│   ├── preceptor-dashboard.tsx       # composición: header + grid + metrics
│   ├── dashboard-header.tsx          # fecha, nombre, botón refresh (spinner)
│   ├── courses-overview.tsx          # grid responsive de cards
│   ├── course-status-card.tsx        # semáforo + % + notRecorded + onClick
│   ├── status-indicator.tsx          # círculo verde/amarillo/rojo con tooltip
│   ├── dashboard-metrics.tsx         # promedio, tendencia semanal, cursos en riesgo
│   └── attendance-trend-chart.tsx    # recharts (ya instalado)
├── alerts/
│   ├── alerts-list.tsx               # lista con filtros (tipo, curso) y paginación
│   ├── alert-item.tsx                # badge tipo + alumno + % + fecha + acciones
│   ├── alert-type-badge.tsx          # warning(amarillo) | critical(naranja) | exceeded(rojo)
│   ├── alert-badge.tsx               # contador para el topbar (bell + número)
│   └── student-alerts-summary.tsx    # resumen en StudentDetail (tab "Alertas")
└── layout/
    └── topbar.tsx                    # AGREGAR slot: <AlertBadge count onAlertsClick/>
```

---

## 4. `apps/client` — páginas e integración

```
apps/client/src/app/(dashboard)/
├── dashboard/page.tsx              # PreceptorDashboard
│                                   # usePreceptorDashboard (polling 30s), useDashboardMetrics
│                                   # click card → /attendance/daily?courseId=
├── alerts/page.tsx                 # AlertsList (useAlerts, useMarkAlertSeen)
└── layout.tsx                      # (dashboard) → useAlertsCount (polling 60s) → Topbar
```

**Integración con `student-detail` (Sprint 03):** agregar tab "Alertas" con `StudentAlertsSummary` (usa `useStudentAlerts`).

---

## 5. Tareas por día

### Día 1: Contrato + hooks dashboard
- [ ] Verificar tipos dashboard vs Swagger
- [ ] `use-preceptor-dashboard` (polling 30s), `use-course-overview`, `use-dashboard-metrics`

### Día 2: Hooks de alertas
- [ ] `use-alerts`, `use-unseen-alerts`, `use-alerts-count` (60s), `use-mark-alert-seen`, `use-student-alerts`

### Día 3–4: Componentes dashboard
- [ ] `status-indicator`, `course-status-card`, `courses-overview`
- [ ] `dashboard-header`, `dashboard-metrics`, `attendance-trend-chart`
- [ ] `preceptor-dashboard` (composición)

### Día 5: Componentes alerts
- [ ] `alerts-list`, `alert-item`, `alert-type-badge`, `alert-badge`, `student-alerts-summary`

### Día 6: Páginas e integración
- [ ] `/dashboard` y `/alerts`
- [ ] Badge en el topbar (layout `(dashboard)`)
- [ ] Tab "Alertas" en `student-detail`

### Día 7: Verificación
- [ ] Polling actualiza sin recargar; pausa en background
- [ ] Marcar vista actualiza badge al instante
- [ ] `biome check` + `tsc --noEmit`

---

## 6. Criterios de aceptación

- [ ] Dashboard muestra los cursos del preceptor con semáforo y `notRecorded`
- [ ] Auto-refresh 30 s actualiza sin recargar
- [ ] Click en card → asistencia con curso pre-seleccionado
- [ ] Badge del topbar muestra conteo de alertas no vistas (polling 60 s)
- [ ] Marcar alerta como vista actualiza badge inmediatamente
- [ ] Alerta escala de color según tipo (warning/critical/exceeded)
- [ ] Preceptor solo ve sus cursos y sus alertas

---

**Siguiente sprint →** [Sprint 08: Reportes y Exportación](./sprint-08-reports-export.md)
