# Historial y métricas de un alumno — Diseño

| Campo      | Valor                                              |
| ---------- | -------------------------------------------------- |
| Fecha      | 2026-10-14                                          |
| Estado     | Aprobado (brainstorming)                            |
| Rama       | `feat/student-history-metrics`                      |
| Ruta nueva | `/attendance/student/[id]`                          |
| Autor      | Sesión SDD/ODD                                      |

## 1. Contexto y problema

Hoy `StudentDetail` (ficha de alumno) expone una pestaña "Historial y Métrica de Asistencia"
que es un placeholder: el prop `attendancePath` apunta a `/attendance/student/{id}`, pero esa
ruta **no existe**. Además, la pestaña "Reporte" ya muestra el resumen anual del alumno
(`StudentReport`), pero no integra en un único lugar la asistencia, las justificaciones, las
alertas, la comparación contra el curso y el desglose por materia.

El objetivo es una **pantalla Visión 360 de un solo alumno** para el ciclo lectivo activo, que el
preceptor/admin pueda monitorear en pantalla y **exportar como legajo** (Excel/PDF).

## 2. Hechos verificados (F)

- **F1** La ruta `/attendance/student/[id]` no existe. `(dashboard)/attendance/` sólo tiene
  `page.tsx` (redirect a daily), `daily/`, `subject/`, `workshop/`.
- **F2** `StudentDetail` ya enlaza con `attendancePath={/attendance/student/${student.id}}` y
  renderiza la pestaña "Historial y Métrica de Asistencia" con texto placeholder.
- **F3** `packages/common/src/constants/nav.ts` **no** tiene regla para `/attendance/student`:
  `allowedRolesForPathname` cae en el `default` (SUPERADMIN, ADMIN, PRECEPTOR, TEACHER).
- **F4** El backend YA soporta export individual: `POST /reports/export/{excel,pdf}` con
  `type:'student'` + `studentId`, roles PRECEPTOR/ADMIN. El contenido es el **legajo anual** del
  alumno (`ExportExcelHandler.studentExecute` → `generateDetailedStudentReport(studentId, academicYearId)`).
- **F5** `ExportExcelRequestDto` / `ExportPdfRequestDto` requieren `month` (1-12) y `year`
  (2020-2100) **aunque** el contenido `student` ignore mes/año. `type` default `'monthly'`.
- **F6** `ExportController.buildFilename(courseId, month, year, ext)` **ignora** `type` y
  `studentId` → el legajo de un alumno se descarga como `asistencia-<curso>-<mes>-<año>.<ext>`
  (nombre engañoso).
- **F7** `reporting.module.ts` provee `IStudentPort` (`StudentAdapter`) con
  `findStudent(studentId): Promise<Student|null>`; `Student` expone `id`, `name`, `documentNumber`.
- **F8** Hooks existentes reutilizables: `useStudent`, `useActiveAcademicYear`, `useStudentReport`,
  `useCourseSummary`, `useAttendanceHistory`, `useAlertsByStudent`, `useSubjects`,
  `useExportExcel`, `useExportPdf`.
- **F9** `StudentReport` trae `months[]`, `totals` (ausencias ponderadas, pueden ser fraccionarias),
  `status` (`ok|at-risk|exceeded`) y `alerts` finas (`{status}[]`).
- **F10** `CourseSummary` trae `months[]` con `averageAttendance: number|null` (null = sin clases).
- **F11** `AttendanceRecord` trae `status`, `subjectId?`, `date?`, `justification?`.
- **F12** `ATTENDANCE_STATUS` = `present | absent | late | late_beyond_tolerance | justified`;
  existe `isLateStatus()`. `ATTENDANCE_THRESHOLDS` = `{ WARNING: 75, CRITICAL: 85 }`.
- **F13** Componentes reutilizables verificados: `MetricCard`, `MonthlyProgressBars`,
  `ReportStatusBadge`, `StudentAlertsSummary`, `ExportActions`, `ExportButton`, `PageHeader`,
  `EmptyState`, `Card`, `Skeleton`, primitivas de `ui/chart`.
- **F14** Helpers de formato: `formatPercent` (null → '—'), `formatDate`, `formatMonthLabel`,
  `formatCount` (coma decimal, sin Intl), `localizeCourseName`.
- **F15** `@repo/ui` y `@repo/common` testean con **vitest** (`vitest run`); `apps/api` con **jest**
  (`apps/api/test/unit/**/*.spec.ts`).
- **F16** Las páginas de cliente leen el id con `useParams()` (no `params` como Promise).

## 3. Decisiones (D)

- **D1 — Sin backend nuevo para datos.** La pantalla se compone 100% con hooks existentes. No se
  crea endpoint de analítica.
- **D2 — Desglose por materia en cliente.** Se agrupa `AttendanceRecord[]` por `subjectId` y se
  mapean los nombres con `useSubjects(courseId)`. Los registros sin `subjectId` se agrupan como
  **"Asistencia diaria"**.
- **D3 — Secciones independientes.** La pantalla **no** se gatea sobre `report == null`: si no hay
  reporte anual, el resumen mensual muestra un vacío, pero historial, materias y alertas siguen
  visibles.
- **D4 — Acceso ADMIN + PRECEPTOR.** Se agrega la regla explícita en `allowedRolesForPathname`
  (`pathname.startsWith('/attendance/student')` → `[ADMIN, PRECEPTOR]`), alineada con
  `/attendance/daily`, `/attendance/workshop` y `/reports`.
- **D5 — Definición de "asistencia" por materia.** `attendancePercent = (present + late) / total * 100`
  donde `total` = cantidad de registros (present+absent+late+justified), y `null` si no hay
  registros. `justified` se informa como conteo propio (ausencia justificada, no computa como
  asistencia). El porcentaje **autoritativo** del alumno sigue saliendo del backend
  (`StudentReport.totals`), no de esta cuenta simple.
- **D6 — Legajo = reporte anual existente.** La exportación usa el endpoint actual con
  `type:'student'`; no se rediseña el contenido del Excel/PDF.
- **D7 — Mejora del nombre de archivo.** Se extrae una función pura `buildExportFilename(...)` y el
  controlador la alimenta con el nombre del alumno vía `IStudentPort` cuando `type==='student'`,
  resultando `legajo-<alumno>-<año>.<ext>`. Elimina F6.
- **D8 — Sólo ciclo lectivo activo.** El rango de historial surge de `useActiveAcademicYear()`
  (`startDate`..`endDate`). Sin selector de ciclo.

## 4. Alcance / Fuera de alcance

**Dentro**

- Ruta `/attendance/student/[id]` con permisos ADMIN/PRECEPTOR.
- Encabezado con identidad del alumno, estado y acciones de exportación (Excel/PDF).
- Métricas del alumno (presentes, inasistencias, tardanzas, promedio de inasistencia).
- Barras de progreso mensual del alumno.
- Gráfico comparativo **alumno vs promedio del curso** por mes.
- Desglose por materia (conteos + asistencia simple).
- Alertas del alumno (lista completa, `useAlertsByStudent`).
- Historial cronológico de registros con estado y justificación.
- Nombre de archivo de exportación específico del alumno.

**Fuera**

- Selector multi-ciclo / histórico de años anteriores.
- Nuevos endpoints de analítica o agregación por materia en backend.
- Rediseño del contenido del Excel/PDF del legajo.
- Comparaciones entre alumnos.

## 5. Arquitectura de la solución

```
apps/client/src/app/(dashboard)/attendance/student/[id]/page.tsx   (client, wiring)
        │
        ▼
@repo/ui  .../features/reports/student-history/
   ├─ student-history-page.tsx            (composición, presentacional)
   ├─ student-course-comparison-chart.tsx (alumno vs curso)
   ├─ student-subject-breakdown.tsx       (por materia)
   └─ student-attendance-history.tsx      (historial + justificación)
        │
        ▼
@repo/ui  lib/student-history.ts          (helpers puros + tests)
```

Hooks consumidos por la página cliente:

| Dato            | Hook                                                             |
| --------------- | ---------------------------------------------------------------- |
| Alumno          | `useStudent(studentId)`                                          |
| Ciclo activo    | `useActiveAcademicYear()`                                        |
| Reporte anual   | `useStudentReport({ studentId, academicYearId })`                |
| Resumen curso   | `useCourseSummary({ courseId, academicYearId })`                 |
| Historial       | `useAttendanceHistory({ studentId, from, to })`                  |
| Alertas         | `useAlertsByStudent({ studentId, academicYearId })`              |
| Materias        | `useSubjects(courseId)`                                          |
| Export          | `useExportExcel()` / `useExportPdf()`                            |

Helpers puros (`lib/student-history.ts`):

- `ATTENDANCE_STATUS_META` — etiqueta + clases por estado de asistencia.
- `tallyAttendance(records)` → `{ present, absent, late, justified, total, attendancePercent }`.
- `buildSubjectBreakdown(records, subjects)` → filas por materia (D2/D5).
- `buildSubjectNameMap(subjects)` → `Map<subjectId, name>`.
- `sortRecordsDesc(records)` → historial más reciente primero.
- `studentAttendanceFromAbsencePercent(pct)` → `100 - pct` acotado, `null` si `null`.
- `buildStudentCourseComparison(studentMonths, courseMonths)` → puntos `{label, alumno, curso}`.

## 6. Riesgos

- **R1** `useSubjects` puede llegar vacío o con nombres faltantes → se cae a "Materia sin nombre"
  y el desglose sigue mostrando conteos.
- **R2** La definición D5 (asistencia simple por materia) difiere del cálculo ponderado del
  backend → se documenta explícitamente en la UI y en el código para no confundir.
- **R3** `AttendanceRecord.date` puede faltar → el historial ordena de forma estable y muestra '—'.
- **R4** Volumen de historial anual grande → se limita el render (lista con scroll, sin
  virtualización en esta iteración).
- **R5** Cambio de `nav.ts` afecta el guard global → cubierto por test unitario existente.
- **R6** Cambio de `buildFilename` en backend → se aísla en una función pura con test; el
  controlador sólo orquesta.

## 7. Criterios de aceptación

1. `/attendance/student/[id]` renderiza sin error para un alumno con datos y para uno sin reporte
   (D3).
2. Sólo ADMIN y PRECEPTOR acceden (D4), verificado por test de `allowedRolesForPathname`.
3. Se muestran: métricas, barras mensuales, comparativa alumno/curso, desglose por materia,
   alertas e historial con justificaciones.
4. El botón Excel y PDF descargan el legajo del alumno; el nombre incluye al alumno (D7).
5. `pnpm test` (o `turbo run test`) y `ts:check` de `@repo/ui`, `@repo/common` y `apps/api` pasan.
6. Lint (`biome check`) sin errores nuevos.

## 8. Plan de verificación

- Unit (vitest): `student-history.ts`, `student-course-comparison-chart`, `student-subject-breakdown`,
  `student-attendance-history`, `student-history-page`, `nav.ts`.
- Unit (jest): `buildExportFilename` + `ExportController` (nombre del alumno).
- Type-check: `@repo/ui`, `@repo/common`, `apps/client`, `apps/api`.
- Manual: navegar desde la ficha de alumno → pestaña "Historial y métrica"; probar exportación xlsx/pdf.
