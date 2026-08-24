# Sprint 08 — Reportes y Exportación · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline) or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Páginas de reportes mensuales por curso con semáforo de riesgo, exportación Excel/PDF y tab "Reporte" por alumno en `StudentDetail`.

**Architecture:** El backend ya expone los endpoints de reporting (`apps/api/src/modules/reporting`) con contrato **distinto** al boceto del sprint. Los tipos (`MonthlyReport`, `StudentReport`, …), rutas (`REPORT_ROUTES`) y hooks (`useMonthlyReport`, `useStudentReport`, `useCourseSummary`, `useAvailableReports`, `useGenerateReport`, `useExportExcel/Pdf`) ya existen en sprints previos y coinciden con la API real. Este sprint completa: tipos de request en common, filename real desde `Content-Disposition`, componentes UI en `packages/ui/src/components/features/reports/`, páginas `/reports/monthly` + redirect y tab "Reporte" en `StudentDetail`.

**Tech Stack:** Next.js 16 App Router · TanStack Query 5 · recharts 2 (wrapper shadcn `ui/chart.tsx`) · Tailwind tokens HSL · sonner · vitest/jsdom en packages.

**Spec:** `doc/planning/frontend/sprints/sprint-08-reports-export.md` (adaptado — ver Deviations)

## Global Constraints

- Contrato API REAL (verificado contra `apps/api/src/modules/reporting/**`):
  - `GET /reports/monthly?courseId&month&year` → `MonthlyReport` (totales agregados por alumno, NO grilla por día)
  - `GET /reports/student/:studentId?academicYearId=` → `StudentReport` (breakdown por MES, no por materia)
  - No existe `GET /reports/risk` → riesgo derivado de `summary` + `status` del monthly report
  - Export: `POST /reports/export/excel|pdf` body JSON `{courseId,month,year,type?,studentId?}` → blob (roles preceptor/admin)
- Biome: tabs, single quotes, line width 80, imports organizados
- Tipado nuevo SIEMPRE en `@repo/common` (instrucción del usuario)
- `apps/client` nunca llama a `/reports/export/*` fuera de los hooks
- Semáforo usa `ATTENDANCE_THRESHOLDS` ({WARNING:75, CRITICAL:85} sobre % inasistencia)
- UI copy en español; verbos activos ("Generar reporte", "Exportar Excel")
- Commits convencionales ≤72 chars; husky corre ts:check+lint+test en cada commit
- Estilo de componentes: funciones nombradas (no forwardRef fuera de `ui/`), `export interface XProps`, `'use client'`, kebab-case, barriles `export *`

## Design direction (frontend-design)

Sistema visual ya establecido (shadcn pastel-green + Inter): se EXTENDIENE, no se reinventa. El elemento firma es el **semáforo de riesgo**: badges con tono (emerald/amber/rose siguiendo la paleta de `MetricCard`) + tooltips que citan los umbrales reales (`≥85% excedido`, `≥75% en riesgo`). Todo lo demás permanece silencioso y consistente. Copys orientados a acción; empty states invitan a generar el reporte del mes en curso (único que permite el backend: `ReportPeriod` rechaza años ≠ actual).

## Deviations vs sprint doc (documentadas para review)

| Sprint doc decía | Realidad → decisión |
|---|---|
| Columnas por día + nonWorkingDays | API trae agregados P/A/L/J por alumno → tabla agregada + `workingDays` en summary card |
| `subject-progress-bars` (por materia) | API trae meses → `monthly-progress-bars.tsx` |
| `risk/` con endpoint propio | Sin endpoint → semáforo + cards dentro de `MonthlyReport` |
| `EXPORT_ROUTES` con `format=` param | Ya existe `REPORT_ROUTES.exportExcel/exportPdf` (POST+blob) → sin cambios |
| Blob link `_blank` | Descarga vía `<a download>` con filename de `Content-Disposition` |

---

### Task 1: `@repo/common` — request types de export/generate

**Files:**
- Create: `packages/common/src/types/reports/export-report.request.type.ts`
- Modify: `packages/common/src/types/index.ts`

- [ ] Step 1: Crear tipo:

```ts
export type ExportFormat = 'xlsx' | 'pdf';

export interface ExportReportRequest {
	courseId: string;
	month: number;
	year: number;
	type?: 'monthly' | 'student';
	studentId?: string;
}

export interface GenerateReportRequest {
	courseId: string;
	month: number;
	year: number;
}
```

- [ ] Step 2: Añadir a `types/index.ts` junto a los demás reports: `export * from './reports/export-report.request.type.js';`
- [ ] Step 3: `pnpm --filter @repo/common build && pnpm --filter @repo/common test`
- [ ] Step 4: Commit `feat(common): add report export and generate request types`

### Task 2: `@repo/hooks` — usar tipos comunes + filename real

**Files:**
- Modify: `packages/hooks/src/features/reports/use-export-report.ts`
- Modify: `packages/hooks/src/features/reports/use-generate-report.ts`

- [ ] Step 1: Grep consumidores de `ExportReportPayload|GenerateReportPayload` (esperado: ninguno fuera del barrel).
- [ ] Step 2: En `use-export-report.ts`: borrar interfaz local, importar `ExportReportRequest` de `@repo/common`, añadir:

```ts
function resolveFilename(
	disposition: string | undefined,
	fallback: string,
): string {
	if (!disposition) return fallback;
	const match = /filename\*?=(?:UTF-8'')?"([^";]+)"/i.exec(disposition);
	if (!match?.[1]) return fallback;
	try {
		return decodeURIComponent(match[1]);
	} catch {
		return match[1];
	}
}
```

y en cada mutationFn usar `res.headers['content-disposition'] as string | undefined` con fallback `reporte-{courseId}-{yyyy}-{MM}.{ext}`.
- [ ] Step 3: En `use-generate-report.ts` reemplazar `GenerateReportPayload` por `GenerateReportRequest` (mantener alias `export type { GenerateReportRequest as GenerateReportPayload };` si hubiera consumidores).
- [ ] Step 4: `pnpm --filter @repo/hooks ts:check` → Commit `feat(hooks): honor server filename on report export downloads`

### Task 3: `@repo/ui` — helpers puros de reportes (TDD)

**Files:**
- Test: `packages/ui/src/lib/report-format.test.ts`
- Create: `packages/ui/src/lib/report-format.ts`
- Modify: `packages/ui/src/lib/format.ts` (añadir `formatMonthLabel`)
- Modify: `packages/ui/src/lib/format.test.ts`

Interfaces producidas (consumidas por Tasks 4–7):

```ts
// report-format.ts
import type {
	AvailableReportPeriod,
	CourseSummaryEntry,
	StudentReportStatus,
} from '@repo/common';

export interface TrendPoint {
	label: string;
	asistencia: number;
}

export const REPORT_STATUS_META: Record<
	StudentReportStatus,
	{ label: string; description: string; badgeClass: string }
>;
// ok → 'Alto rendimiento' emerald; 'at-risk' → 'En riesgo' amber; exceeded → 'Umbral excedido' rose

export const REPORT_ALERT_META: Record<
	string,
	{ label: string; iconClass: string }
>; // warning/critical/exceeded

export function getAbsencePercentTone(absencePercent: number): string; // clases texto
export function getAttendanceBarTone(absencePercent: number): string; // clases barra
export function getStatusTooltip(
	status: StudentReportStatus,
	absencePercent?: number,
): string; // cita ATTENDANCE_THRESHOLDS
export function buildTrendChartData(months: CourseSummaryEntry[]): TrendPoint[]; // asc por fecha
export function sortPeriodsDesc(periods: AvailableReportPeriod[]): AvailableReportPeriod[];

// format.ts
export function formatMonthLabel(month: number, style?: 'short' | 'long'): string;
```

- [ ] Step 1: Escribir tests fallando en `report-format.test.ts`: meta completa (3 estados), umbrales en tooltips (contiene "85%" y "75%"), tonos por corte (70→ok-tone, 80→warning-tone, 90→critical-tone), `buildTrendChartData` ordena asc y etiqueta corto capitalizado, `sortPeriodsDesc` desc, `formatMonthLabel(3)` === 'Marzo', `(3,'short')` === 'Mar'.
- [ ] Step 2: `pnpm --filter @repo/ui test -- report-format` → FAIL
- [ ] Step 3: Implementar (usa `date-fns/format` + `locale/es` como `formatDate`; `ATTENDANCE_THRESHOLDS` desde `@repo/common`).
- [ ] Step 4: Tests PASS → Commit `feat(ui): pure helpers for report statuses and trend data`

### Task 4: `@repo/ui` — shared: semáforo + botón export

**Files:**
- Test: `packages/ui/src/components/features/reports/shared/report-status-badge.test.tsx`
- Create: `packages/ui/src/components/features/reports/shared/report-status-badge.tsx`
- Create: `packages/ui/src/components/features/reports/shared/export-button.tsx`
- Create: `packages/ui/src/components/features/reports/shared/index.ts`

```tsx
// report-status-badge.tsx ('use client')
export interface ReportStatusBadgeProps {
	status: StudentReportStatus;
	absencePercent?: number;
	className?: string;
}
// Badge variant="outline" + cn(REPORT_STATUS_META[status].badgeClass) dentro de
// TooltipProvider>Tooltip>TooltipTrigger asChild span cursor-default + TooltipContent(getStatusTooltip)

// export-button.tsx ('use client')
export interface ExportButtonProps {
	format: ExportFormat; // 'xlsx' | 'pdf'
	onExport: () => void | Promise<unknown>;
	isPending?: boolean;
	disabled?: boolean;
}
// Button variant="outline" size="sm", icono FileSpreadsheet/FileText,
// label 'Excel'/'PDF', Loader2 animate-spin cuando isPending, disabled durante pendiente
```

- [ ] Step 1: Test RTL: badge muestra label por status y clase correcta; button dispara onExport, muestra loader cuando isPending.
- [ ] Step 2: FAIL → implementar → PASS.
- [ ] Step 3: Commit `feat(ui): report status badge and export button`

### Task 5: `@repo/ui` — monthly report components

**Files (todas `'use client'`, carpeta `features/reports/monthly-report/`):**
- `report-filters.tsx` — `ReportFiltersState { courseId?: string; month?: number; year?: number }`; props `{ courses, periods, value, onCourseChange, onPeriodChange, isLoadingCourses, isLoadingPeriods }`. Dos `Select` (curso con label igual que StudentsTable; período con items `formatMonthLabel(m) ${y}`, deshabilitado sin períodos).
- `report-summary-cards.tsx` — props `{ summary?: MonthlyReport['summary'] | null; workingDays?: number; isLoading?: boolean }`. Grid 2×lg:4 `MetricCard` (success asistencia promedio `formatPercent`, warning en riesgo, destructive excedidos, default días hábiles); loading → 4 skeletons pulse.
- `report-status-cell.tsx` — props `{ status, absencePercent, alerts }`: `ReportStatusBadge` + hasta 2 chips de alerta (`REPORT_ALERT_META`, AlertTriangle/ShieldAlert h-3.5) con tooltip.
- `monthly-report-table.tsx` — props `{ students: MonthlyReportStudent[]; isLoading?: boolean }`. Columnas DataTable: Estudiante (fullName font-medium), DNI (mono), Presentes/Ausentes/Tardanzas/Justificadas (center), `% Inasistencia` (`getAbsencePercentTone`, accessor absencePercent), Estado → `ReportStatusCell`.
- `attendance-trend-chart.tsx` — props `{ months: CourseSummaryEntry[]; isLoading?: boolean }`. Card + `ChartContainer` config `{ asistencia: { label: 'Asistencia', color: 'hsl(var(--primary))' } }` + `AreaChart` monotone, YAxis 0–100 `tickFormatter={(v)=>`${v}%`}`, XAxis dataKey label, `ChartTooltipContent`. Sin datos → mensaje muted "Aún no hay suficientes meses generados".
- `export-actions.tsx` — props `{ onExport(format: ExportFormat): unknown; pendingFormat: ExportFormat | null; disabled?: boolean }`; dos `ExportButton`.
- `monthly-report.tsx` — composición final. Props:

```ts
export interface MonthlyReportProps {
	filters: ReportFiltersState;
	onCourseChange: (courseId: string) => void;
	onPeriodChange: (period: { month: number; year: number }) => void;
	courses: ICourseResponse[];
	periods: AvailableReportPeriod[];
	report: MonthlyReport | null;
	trendMonths: CourseSummaryEntry[];
	isLoadingCourses: boolean;
	isLoadingPeriods: boolean;
	isLoadingReport: boolean;
	isLoadingTrend: boolean;
	onGenerate: () => void;
	isGenerating: boolean;
	onExport: (format: ExportFormat) => unknown;
	pendingExport: ExportFormat | null;
}
```

Layout: `space-y-6` → Filters → SummaryCards → tabla (título "Detalle por alumno") → TrendChart ("Tendencia del año"). Estados: sin curso → `EmptyState` (icono FileBarChart) "Elegí un curso para ver su reporte"; curso sin períodos → `EmptyState` acción "Generar reporte del mes" (`onGenerate`, hint: solo mes en curso); cargando → skeleton de tabla vía prop isLoading.

- [ ] Barrel `monthly-report/index.ts` + `features/reports/shared/index.ts` + `features/reports/index.ts` + registrar en root `src/index.tsx` tras `features/schedule`.
- [ ] `pnpm --filter @repo/ui test && pnpm --filter @repo/ui ts:check` → Commit `feat(ui): monthly course report components with risk traffic lights`

### Task 6: `@repo/ui` — student report components

**Files (carpeta `features/reports/student-report/`):**
- `monthly-progress-bars.tsx` — props `{ entries: StudentMonthlyEntry[] }`. Filas ordenadas desc: label `${formatMonthLabel(month)} ${year}` w-28, track `h-2 rounded-full bg-muted` con inner width `clamp(0, 100-absencePercent)` + `getAttendanceBarTone`, derecha `%` asistencia. Empty → texto muted.
- `student-report.tsx` — props `{ report: StudentReport | null; isLoading?: boolean }`. Composición: Card cabecera (Avatar iniciales, nombre, DNI•curso, `ReportStatusBadge`, alertas como lista con iconos si existen) → 4 `MetricCard` totales (Presentes success/Ausentes destructive/Tardanzas warning/Justificadas info, subtitle totalDays en promedio card… concretamente: Promedio de inasistencia default) → Card "Desempeño mensual" con `MonthlyProgressBars`. Loading → skeleton; null → EmptyState "Sin reportes generados para este alumno".
- [ ] Actualizar barrel `student-report/index.ts`, `features/reports/index.ts`.
- [ ] Tests: extender smoke del badge ya cubierto; aquí solo `ts:check` + lint (componentes de layout sin lógica nueva).
- [ ] Commit `feat(ui): student annual report view with monthly progress bars`

### Task 7: Tab "Reporte" en StudentDetail + página alumno

**Files:**
- Modify: `packages/ui/src/components/features/students/student-detail.tsx`
- Modify: `apps/client/src/app/(dashboard)/students/[id]/page.tsx`

- [ ] Step 1: `StudentDetailProps` += `reportTab?: ReactNode;`. TabsList: `className={cn('grid w-full max-w-md', reportTab ? 'grid-cols-4' : 'grid-cols-3')}`. Render condicional de `<TabsTrigger value="reporte">Reporte</TabsTrigger>` y `<TabsContent value="reporte" className="pt-4">{reportTab}</TabsContent>` solo si `reportTab`.
- [ ] Step 2: Página: `useActiveAcademicYear()` + `useStudentReport({ studentId, academicYearId: activeYear?.id })`; pasar `reportTab={<StudentReport report={report ?? null} isLoading={isLoading} />}`. (Solo admin/preceptor llegan a /students según nav guard.)
- [ ] Step 3: `pnpm ts:check` turbo → Commit `feat(client): reports tab inside student detail`

### Task 8: Páginas `/reports` (redirect + monthly)

**Files:**
- Modify: `apps/client/src/app/(dashboard)/reports/page.tsx` → server component `redirect('/reports/monthly')` (borrar stub).
- Create: `apps/client/src/app/(dashboard)/reports/monthly/page.tsx`

Wiring (`'use client'`, patrón URL-sync de `attendance/daily`):
- `useAuth()` → role; `isPreceptor = role==='preceptor'`
- `useActiveAcademicYear()`; `useMyCourses({ academicYearId, isPreceptor })`
- `useAvailableReports(courseId || undefined)`
- `useMonthlyReport({ courseId, month, year })` / `useCourseSummary({ courseId, academicYearId })`
- Auto-selección: al cargar cursos → primer curso si falta; al cargar períodos → `sortPeriodsDesc[0]` si falta período; sync `router.replace(?courseId&month&year)`
- Mutaciones: `useGenerateReport` (toast success/error, invalidations ya en hook), `useExportExcel/useExportPdf` con `pendingFormat` state y try/catch → `toast.success('Descarga lista')` / `toast.error('No se pudo exportar…')`
- Render `<MonthlyReport {...todo} />` bajo `PageHeader title="Reportes" description="Asistencia mensual por curso"` + `actions={<ExportActions/>}`? No — ExportActions vive dentro de MonthlyReport (Task 5). PageHeader simple.

- [ ] Verificar manual: redirect funciona; filtros sincronizan URL; export descarga con nombre server.
- [ ] Commit `feat(client): monthly reports page with role-aware filters and exports`

### Task 9: Verificación final

- [ ] `pnpm build --filter=@repo/*` (common antes de hooks/ui)
- [ ] `pnpm ts:check` (turbo, todos los workspaces)
- [ ] `pnpm lint:check`
- [ ] `pnpm run test`
- [ ] Criterios de aceptación del sprint revisados uno a uno (semáforo↔umbrales, export real, filtros por rol, sin llamadas /export fuera de hooks)

---

## Self-review

- Cobertura sprint: mensual ✓ (T5/T8), por alumno ✓ (T6/T7), export ✓ (T2/T4/T5), semáforo ✓ (T3/T4), riesgo ✓ derivado, filtros por rol ✓ (T8), redirect ✓ (T8), tipado en common ✓ (T1).
- Placeholders: ninguno; código completo en tareas o interfaces exactas definidas.
- Consistencia de nombres verificada entre tareas (`ReportStatusBadge`, `buildTrendChartData`, `ExportFormat`, props de `MonthlyReport` usadas idénticas en T8).
