# Sprint 09 — Reportes Mensuales

> **Objetivo:** Implementar la generación de reportes mensuales por curso y reportes individuales de estudiante con métricas de asistencia.
> **Duración:** 1 semana · **Estimación:** 30 h · **Dependencias:** Sprint 08

---

## Resumen de horas

| Área | Horas |
|---|---|
| Domain Layer | 4 |
| Application Layer | 8 |
| Infrastructure Layer | 5 |
| Presentation Layer | 4 |
| Frontend (UI + hooks + páginas) | 9 |
| **Total** | **30** |

---

## Concepto clave: Nuevo bounded context `reporting`

Los reportes son proyecciones de lectura sobre los datos de asistencia. Viven en el bounded context `reporting` porque tienen su propia lógica de presentación y podría escalar independientemente (cola de generación, caché agresiva, etc.). Se comunica con `attendance` y `academic` solo por referencia de IDs.

`MonthlyReport` es una entidad pre-calculada que se guarda en la base de datos para evitar recalcular cada vez que se abre el reporte. Se regenera cuando se llama a `POST /reports/generate` o automáticamente (futuro: cron job).

---

## 1. Domain Layer — `modules/reporting/domain` (nuevo bounded context)

```
apps/api/src/modules/reporting/domain/
├── entities/
│   └── monthly-report.entity.ts            # Reporte pre-calculado para un curso y mes
├── value-objects/
│   ├── report-id.value-object.ts
│   └── report-period.value-object.ts       # { month: 1-12, year: 2024 }
│                                           # validate(): no permite mes futuro
│                                           # toDateRange(): { from: Date, to: Date }
├── services/
│   ├── report-generation.service.ts        # generateMonthlyReport(courseId, period): MonthlyReportData
│   │                                       # Coordina consultas a AttendanceRecord y Student vía interfaces
│   └── metrics-calculation.service.ts      # calculateStudentMetrics(records[], workingDays): StudentMetrics
│                                           # StudentMetrics: { present, absent, late, justified, absencePercent, status }
│                                           # status: 'ok' | 'at-risk' | 'exceeded'
└── repositories/
    └── report.repository.interface.ts      # findByCourseAndPeriod, findByCourse, save
```

### Esquema de entidad

| Entidad | Campos |
|---|---|
| `MonthlyReport` | `id`, `tenantId`, `courseId`, `academicYearId`, `month`, `year`, `data` (JSONB — ver estructura abajo), `generatedAt`, `createdAt` |

### Estructura del campo `data` (JSONB)

```ts
// MonthlyReportData
{
  courseName:    string,
  level:         'primary' | 'secondary',
  period:        { month: number, year: number },
  workingDays:   number,
  students: [
    {
      studentId:      string,
      fullName:       string,
      documentNumber: string,
      present:        number,
      absent:         number,
      late:           number,
      justified:      number,
      absencePercent: number,
      status:         'ok' | 'at-risk' | 'exceeded',
      alerts:         AlertType[]   // alertas activas del alumno
    }
  ],
  summary: {
    averageAttendance: number,
    studentsAtRisk:    number,
    studentsExceeded:  number
  }
}
```

> **Deuda técnica documentada:** guardar `data` como JSONB permite consultas flexibles pero no permite filtrar por campos internos eficientemente. Si en el futuro se necesita filtrar por `studentId` dentro del JSON, considerar tabla separada `monthly_report_student_records`.

---

## 2. Application Layer — `modules/reporting/application`

```
apps/api/src/modules/reporting/application/
├── commands/
│   ├── generate-monthly-report/
│   │   ├── generate-monthly-report.command.ts   # { courseId, month, year }
│   │   └── generate-monthly-report.handler.ts   # 1. valida período no es futuro
│   │                                             # 2. llama ReportGenerationService
│   │                                             # 3. guarda/actualiza MonthlyReport en repo
│   │                                             # 4. retorna MonthlyReportResponseDto
│   └── generate-student-report/
│       ├── generate-student-report.command.ts   # { studentId, academicYearId }
│       └── generate-student-report.handler.ts   # genera reporte completo del año del alumno
│                                                # (no se persiste, se calcula on-demand)
├── queries/
│   ├── get-monthly-report/
│   │   ├── get-monthly-report.query.ts           # { courseId, month, year }
│   │   └── get-monthly-report.handler.ts         # busca en repo, si no existe → genera y guarda
│   ├── get-student-report/
│   │   ├── get-student-report.query.ts           # { studentId, academicYearId }
│   │   └── get-student-report.handler.ts         # calcula on-demand, retorna StudentReportResponseDto
│   ├── get-reports-by-course/
│   │   ├── get-reports-by-course.query.ts        # { courseId } — lista de reportes disponibles
│   │   └── get-reports-by-course.handler.ts      # retorna meses con reporte generado
│   └── get-course-summary/
│       ├── get-course-summary.query.ts           # { courseId, academicYearId }
│       └── get-course-summary.handler.ts         # resumen del año completo por mes
├── dtos/
│   ├── monthly-report.response.dto.ts            # mapea MonthlyReportData a DTO tipado
│   ├── student-report-entry.dto.ts               # datos de un alumno dentro del reporte
│   ├── student-report.response.dto.ts            # reporte completo del alumno: meses + totales + alertas
│   ├── course-summary.response.dto.ts            # { month, year, averageAttendance }[] — para gráfico
│   └── generate-report.request.dto.ts            # courseId, month, year
└── reporting.module.ts                           # registra commands, queries, repos, servicios
```

---

## 3. Infrastructure Layer — `modules/reporting/infrastructure`

```
apps/api/src/modules/reporting/infrastructure/
├── persistence/
│   ├── entities/
│   │   └── monthly-report.orm-entity.ts    # @Entity() con @Property({ type: 'json' }) data
│   ├── repositories/
│   │   └── report.repository.ts            # implementa IReportRepository
│   ├── mappers/
│   │   └── report.mapper.ts
│   └── reporting.persistence.module.ts
└── services/
    └── report-data.service.ts              # Servicio de infraestructura que consulta attendance_records
                                            # y students directamente (sin cruzar bounded context por dominio)
                                            # getRecordsForReport(courseId, from, to): AttendanceRecordRaw[]
                                            # getStudentsForCourse(courseId): StudentRaw[]
```

> **Nota de arquitectura:** `ReportDataService` consulta directamente las tablas de otros contextos vía SQL porque los reportes son proyecciones de lectura. Esta es la excepción controlada a la regla de no cruzar contextos. No usa los repositorios del dominio de attendance/academic sino queries SQL directas.

### Migración a generar

```bash
pnpm mikro-orm migration:create --name=create_monthly_reports
```

Tabla:
- `monthly_reports` (id, tenant_id, course_id, academic_year_id, month, year, data JSONB, generated_at, created_at)
- Índice único: `(course_id, month, year)`

---

## 4. Presentation Layer — `modules/reporting/presentation`

```
apps/api/src/modules/reporting/presentation/
├── controllers/
│   ├── reports.controller.ts               # GET y POST de reportes mensuales
│   └── student-reports.controller.ts      # GET de reportes de alumno
└── reporting.presentation.module.ts
```

### Endpoints

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| `GET` | `/reports/monthly?courseId=&month=&year=` | `preceptor`, `admin` | Obtener reporte (genera si no existe) |
| `POST` | `/reports/generate` | `admin`, `preceptor` | Forzar regeneración del reporte |
| `GET` | `/reports/course/:courseId/summary?academicYearId=` | `preceptor`, `admin` | Resumen del año por mes |
| `GET` | `/reports/course/:courseId/available` | `preceptor`, `admin` | Meses con reporte disponible |
| `GET` | `/reports/student/:studentId?academicYearId=` | `preceptor`, `admin` | Reporte completo del alumno |

---

## 5. Frontend

### 5.1 `packages/ui` — componentes nuevos

```
packages/ui/src/components/features/reports/
├── monthly-report-table/
│   ├── index.ts
│   ├── monthly-report-table.tsx            # Tabla de alumnos con métricas del mes
│   │                                       # Columnas: Apellido, Nombre, Presentes, Ausentes, Tardanzas, Justificados, %, Estado
│   │                                       # Props: report: MonthlyReportResponseDto, onViewStudent
│   └── report-row.tsx                      # Fila del alumno con estado coloreado
│                                           # Props: entry: StudentReportEntryDto, onViewStudent
├── student-report/
│   ├── index.ts
│   ├── student-report.tsx                  # Vista del reporte completo del alumno
│   │                                       # Props: report: StudentReportResponseDto
│   └── student-monthly-summary.tsx        # Tabla de meses: mes, presentes, ausentes, %
│                                           # Props: months: MonthlyEntry[]
├── month-selector.tsx                      # Selector de mes/año con meses disponibles resaltados
│                                           # Props: availableMonths: { month, year }[], value, onChange
├── attendance-chart.tsx                    # Gráfico de barras de asistencia por mes (CSS puro o recharts)
│                                           # Props: data: { month, averageAttendance }[]
├── report-summary-card.tsx                 # Card con métricas globales: promedio, en riesgo, superados
│                                           # Props: summary: { averageAttendance, studentsAtRisk, studentsExceeded }
└── report-status-badge.tsx                # Badge: ok (verde) | at-risk (amarillo) | exceeded (rojo)
                                            # Props: status: 'ok' | 'at-risk' | 'exceeded'
```

### 5.2 `packages/hooks` — hooks nuevos

> **Patrón:** todos los hooks importan `apiClient` de `../lib/axios-client` (interno de `packages/hooks`) y las rutas de `@vir-ttend/common`. Ningún hook hardcodea URLs ni importa axios directamente.

```
packages/hooks/src/
├── reports/
│   ├── use-monthly-report.ts               # useQuery → apiClient.get(reports/monthly?courseId=&month=&year=
│   ├── use-generate-report.ts             # useMutation → apiClient.post(reports/generate
│   ├── use-course-summary.ts              # useQuery → apiClient.get(reports/course/:id/summary
│   ├── use-available-reports.ts           # useQuery → apiClient.get(reports/course/:id/available
│   └── use-student-report.ts             # useQuery → apiClient.get(reports/student/:id
└── index.ts                               # actualizar
```

### 5.3 `apps/client` — páginas

```
apps/client/src/app/(dashboard)/reports/
├── monthly/
│   └── page.tsx                            # Importa MonthlyReportTable, MonthSelector, ReportSummaryCard
│                                           # Usa useMonthlyReport, useAvailableReports, useGenerateReport
│                                           # Query params: courseId, month, year
├── student/
│   └── [id]/
│       └── page.tsx                        # Importa StudentReport de @vir-ttend/ui
│                                           # Usa useStudentReport
└── course/
    └── [id]/
        └── page.tsx                        # Importa AttendanceChart, ReportSummaryCard
                                            # Usa useCourseSummary, useAvailableReports
```

---

## 6. Testing

```
apps/api/test/unit/reporting/
├── report-generation.service.spec.ts       # mock datos de asistencia, verificar cálculo correcto
│                                           # probar con días no hábiles y justificaciones
├── metrics-calculation.service.spec.ts     # calculateStudentMetrics con distintos escenarios
│                                           # status: ok < 50%, at-risk 50-74%, exceeded ≥ 75%
└── get-monthly-report.handler.spec.ts      # verificar que genera si no existe y devuelve el existente
```

---

## 7. Tareas por día

### Día 1: Domain Layer
- [ ] Crear `MonthlyReport` entity
- [ ] Crear `ReportPeriodVO` con validación y conversión a date range
- [ ] Implementar `ReportGenerationService`
- [ ] Implementar `MetricsCalculationService`

### Día 2: Application Layer — commands
- [ ] `GenerateMonthlyReportCommand` + handler
- [ ] `GenerateStudentReportCommand` + handler

### Día 3: Application Layer — queries + DTOs
- [ ] `GetMonthlyReportQuery` + handler (con fallback a generación)
- [ ] `GetStudentReportQuery` + handler
- [ ] `GetCourseSummaryQuery` + handler
- [ ] Todos los DTOs

### Día 4: Infrastructure Layer
- [ ] ORM entity con tipo JSONB
- [ ] `ReportRepository`
- [ ] `ReportDataService` con queries directas
- [ ] Migración

### Día 5: Presentation Layer
- [ ] Controllers con endpoints
- [ ] Probar generación y recuperación con Postman

### Día 6–7: Frontend
- [ ] Componentes en `packages/ui`
- [ ] Hooks en `packages/hooks`
- [ ] Páginas en `apps/client`

---

## 8. Criterios de aceptación

- [ ] Reporte mensual genera correctamente con presentes, ausentes, tardanzas y % por alumno
- [ ] Porcentajes son precisos considerando días hábiles y justificaciones
- [ ] Si el reporte ya existe, se devuelve el pre-calculado sin recalcular
- [ ] `POST /reports/generate` fuerza la regeneración y actualiza el existente
- [ ] Reporte de alumno muestra todos los meses del año académico
- [ ] Tabla en frontend ordena por apellido y permite navegar al detalle del alumno
- [ ] Gráfico de tendencia mensual es visible y correcto
- [ ] Selector de mes solo muestra meses con al menos un día hábil transcurrido

---

**Siguiente sprint →** Sprint 10: Exportación a Excel y PDF
