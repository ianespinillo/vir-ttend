# Sprint 07 — Panel de Preceptoría

> **Objetivo:** Implementar el dashboard centralizado del preceptor con vista consolidada de todos sus cursos, métricas en tiempo real y navegación rápida al registro.
> **Duración:** 1 semana · **Estimación:** 28 h · **Dependencias:** Sprint 05, Sprint 06

---

## Resumen de horas

| Área | Horas |
|---|---|
| Domain Layer | 2 |
| Application Layer | 6 |
| Infrastructure Layer | 2 |
| Presentation Layer | 4 |
| Frontend (UI + hooks + páginas) | 14 |
| **Total** | **28** |

---

## Concepto clave: Dashboard read-only

El panel de preceptoría es 100% de lectura. No genera ni modifica registros de asistencia. Su objetivo es dar una visión panorámica del día: cuántos alumnos faltaron en cada curso, cuáles están en riesgo de superar el umbral, y acceso rápido a cada curso para registrar o corregir. Los datos se actualizan con polling cada 30 segundos.

---

## 1. Domain Layer — `modules/attendance/domain` (ampliar)

```
apps/api/src/modules/attendance/domain/
└── services/
    └── dashboard.service.ts                # buildCourseSnapshot(courseId, date, academicYear): CourseSnapshot
                                            # CourseSnapshot: { courseId, courseName, totalStudents,
                                            #   present, absent, late, justified, notRecorded,
                                            #   absencePercent, statusColor: 'green'|'yellow'|'red' }
                                            # statusColor: green < WARNING%, yellow < CRITICAL%, red >= CRITICAL%
                                            # Usa AttendanceCalculationService internamente
```

---

## 2. Application Layer — `modules/attendance/application` (ampliar)

```
apps/api/src/modules/attendance/application/
├── queries/
│   ├── get-preceptor-dashboard/
│   │   ├── get-preceptor-dashboard.query.ts        # { preceptorId, date }
│   │   └── get-preceptor-dashboard.handler.ts      # 1. obtiene cursos del preceptor
│   │                                               # 2. por cada curso: llama DashboardService.buildCourseSnapshot
│   │                                               # 3. retorna PreceptorDashboardResponseDto
│   ├── get-course-daily-overview/
│   │   ├── get-course-daily-overview.query.ts      # { courseId, date }
│   │   └── get-course-daily-overview.handler.ts    # detalle de un curso específico para el día
│   └── get-dashboard-metrics/
│       ├── get-dashboard-metrics.query.ts           # { preceptorId, academicYearId }
│       └── get-dashboard-metrics.handler.ts         # métricas globales del año:
│                                                   # promedio de asistencia por curso, tendencia semanal
├── dtos/
│   ├── course-snapshot.dto.ts                      # courseId, courseName, level, totalStudents,
│   │                                               # present, absent, late, justified, notRecorded,
│   │                                               # absencePercent, statusColor, lastUpdated
│   ├── preceptor-dashboard.response.dto.ts         # date, courses: CourseSnapshotDto[], globalMetrics
│   └── dashboard-metrics.response.dto.ts           # averageAttendance, coursesAtRisk[], weeklyTrend[]
└── attendance.module.ts                            # actualizar
```

---

## 3. Infrastructure Layer — `modules/attendance/infrastructure` (ampliar)

```
apps/api/src/modules/attendance/infrastructure/
└── persistence/
    └── repositories/
        └── attendance-record.repository.ts         # agregar:
                                                    # getCourseSummaryForDate(courseId, date): { present, absent, late, justified, notRecorded }
                                                    # query optimizada con COUNT y GROUP BY en SQL
```

---

## 4. Presentation Layer — `modules/attendance/presentation` (ampliar)

```
apps/api/src/modules/attendance/presentation/
├── controllers/
│   └── dashboard.controller.ts             # GET endpoints del dashboard
└── attendance.presentation.module.ts      # actualizar
```

### Endpoints

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| `GET` | `/dashboard?date=` | `preceptor`, `admin` | Dashboard completo del preceptor |
| `GET` | `/dashboard/course/:courseId?date=` | `preceptor`, `admin` | Overview de un curso específico |
| `GET` | `/dashboard/metrics?academicYearId=` | `preceptor`, `admin` | Métricas del año |

---

## 5. Frontend

### 5.1 `packages/ui` — componentes nuevos

```
packages/ui/src/components/features/dashboard/
├── preceptor-dashboard.tsx                 # Página completa del dashboard del preceptor
│                                           # Combina: DashboardHeader + CourseGrid + DashboardMetrics
│                                           # Props: dashboard: PreceptorDashboardResponseDto, onNavigateToCourse, onRefresh
├── dashboard-header.tsx                    # Encabezado: fecha, nombre del preceptor, botón refresh
│                                           # Props: preceptorName, date, lastRefreshed, onRefresh
├── courses-overview/
│   ├── index.ts
│   ├── courses-overview.tsx                # Grid responsivo de CourseStatusCard
│   │                                       # Props: courses: CourseSnapshotDto[], onSelectCourse
│   └── course-status-card.tsx             # Card de un curso con semáforo de estado
│                                           # Verde: asistencia OK | Amarillo: alerta | Rojo: crítico
│                                           # Props: snapshot: CourseSnapshotDto, onNavigate
├── dashboard-metrics/
│   ├── index.ts
│   ├── dashboard-metrics.tsx              # Bloque de métricas globales del año
│   │                                       # Props: metrics: DashboardMetricsResponseDto
│   ├── attendance-trend-chart.tsx         # Gráfico de tendencia semanal (recharts o chart simple CSS)
│   │                                       # Props: weeklyTrend: { date, percent }[]
│   └── courses-at-risk-list.tsx           # Lista de cursos con más del umbral de ausencias
│                                           # Props: coursesAtRisk: CourseSnapshotDto[]
└── status-indicator.tsx                   # Círculo de color con tooltip: verde/amarillo/rojo
                                            # Props: color: 'green' | 'yellow' | 'red', size?: 'sm'|'md'|'lg'
```

### 5.2 `packages/ui` — actualizar layout

```
packages/ui/src/components/layout/
└── sidebar.tsx                             # Agregar link /dashboard como ítem principal del preceptor
                                            # Marcar como activo si currentPath === '/dashboard'
```

### 5.3 `packages/hooks` — hooks nuevos

> **Patrón:** todos los hooks importan `apiClient` de `../lib/axios-client` (interno de `packages/hooks`) y las rutas de `@vir-ttend/common`. Ningún hook hardcodea URLs ni importa axios directamente.

```
packages/hooks/src/
├── attendance/
│   ├── use-preceptor-dashboard.ts          # useQuery con refetchInterval: 30000
│   │                                       # → GET /dashboard?date=
│   ├── use-course-overview.ts             # useQuery → apiClient.get(dashboard/course/:id?date=
│   └── use-dashboard-metrics.ts           # useQuery → apiClient.get(dashboard/metrics?academicYearId=
└── index.ts                               # actualizar
```

### 5.4 `apps/client` — páginas

```
apps/client/src/app/(dashboard)/
└── dashboard/
    └── page.tsx                            # Importa PreceptorDashboard de @vir-ttend/ui
                                            # Usa usePreceptorDashboard (auto-refresh cada 30s)
                                            # useDashboardMetrics
                                            # Al hacer click en un curso → navega a /attendance/daily?courseId=
```

---

## 6. Testing

```
apps/api/test/unit/attendance/
├── dashboard.service.spec.ts               # buildCourseSnapshot: statusColor correcto según umbrales
│                                           # notRecorded = totalStudents - registrados
└── get-preceptor-dashboard.handler.spec.ts # mock N cursos, verificar que llama snapshot por cada uno
```

---

## 7. Tareas por día

### Día 1: Domain + Application Layer
- [ ] Implementar `DashboardService.buildCourseSnapshot`
- [ ] Crear `GetPreceptorDashboardQuery` + handler
- [ ] Crear `GetDashboardMetricsQuery` + handler
- [ ] DTOs

### Día 2: Infrastructure + Presentation
- [ ] Agregar `getCourseSummaryForDate` al repository (query SQL optimizada)
- [ ] `DashboardController` con endpoints
- [ ] Probar con Postman con múltiples cursos

### Día 3–4: Frontend — componentes UI
- [ ] `PreceptorDashboard`, `DashboardHeader`
- [ ] `CoursesOverview` y `CourseStatusCard` con semáforo
- [ ] `DashboardMetrics` y `AttendanceTrendChart`
- [ ] `StatusIndicator`

### Día 5: Frontend — hooks y páginas
- [ ] Hooks con auto-refresh en `packages/hooks`
- [ ] Página `/dashboard` en `apps/client`
- [ ] Navegación: click en card → `/attendance/daily?courseId=`
- [ ] Actualizar sidebar

### Día 6–7: Integración y polish
- [ ] Test de auto-refresh (verificar que no hace request mientras la tab está en background)
- [ ] Optimizar query SQL de resumen (EXPLAIN ANALYZE)
- [ ] Tests unitarios

---

## 8. Criterios de aceptación

- [ ] Dashboard muestra todos los cursos del preceptor autenticado con su estado del día
- [ ] Semáforo: verde si % ausencias < WARNING, amarillo si < CRITICAL, rojo si ≥ CRITICAL
- [ ] `notRecorded` muestra cuántos alumnos aún no tienen registro del día
- [ ] Auto-refresh cada 30 segundos actualiza los datos sin recargar la página
- [ ] Click en un curso navega a `/attendance/daily?courseId=` con el curso pre-seleccionado
- [ ] Dashboard de métricas muestra tendencia semanal del promedio de asistencia
- [ ] Endpoint `/dashboard` filtra por `preceptorId` del JWT (no puede ver cursos de otros preceptores)

---

**Siguiente sprint →** Sprint 08: Alertas Automáticas
