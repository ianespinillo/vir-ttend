# Historial y métricas de un alumno — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development`
> (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar la pantalla `/attendance/student/[id]` que muestra, para el ciclo lectivo activo,
las métricas de asistencia de un alumno, su comparación contra el promedio del curso, su desglose
por materia, sus alertas y su historial de asistencia, con exportación del legajo (Excel/PDF).

**Architecture:** Composición presentacional en `@repo/ui` (`reports/student-history/`) más helpers
puros en `packages/ui/src/lib/student-history.ts`, consumidos por una página cliente en
`apps/client` que cablea los hooks existentes de `@repo/hooks`. Sin cambios de datos en backend,
salvo el nombre del archivo de exportación del alumno.

**Tech Stack:** pnpm workspaces + Turbo, Next.js 16 (App Router, client components), React 19,
TanStack Query, Tailwind 3, shadcn/ui, Recharts, vitest (ui/common), jest (api), Biome.

**Spec:** `docs/superpowers/specs/2026-10-14-student-history-metrics-design.md`

**Branch:** `feat/student-history-metrics`

## Global Constraints

- Artefactos técnicos, código, identificadores y comentarios en **inglés**; copy de UI en **español neutro**.
- Los tests de `@repo/ui` y `@repo/common` usan **vitest** (`describe`/`it` en español); los de `apps/api` usan **jest**.
- Un commit por tarea (Conventional Commits). Nunca agregar `Co-Authored-By`.
- No introducir endpoints nuevos de backend ni cambiar contratos de datos existentes.
- No alterar el formato del nombre de archivo del reporte **mensual** (sólo agregar el caso `student`).
- Los componentes presentacionales no deben envolver QueryClient ni hacer fetch.

---

## Task 1: Regla de navegación para `/attendance/student`

**Files:**

- Modify: `packages/common/src/constants/nav.ts`
- Test: `packages/common/src/constants/nav.test.ts`

**Contexto:** F3/D4 — la ruta no tiene regla y cae en el `default` (incluye TEACHER). Debe ser
sólo ADMIN y PRECEPTOR, igual que `/attendance/daily`.

- [ ] **Step 1: Escribir el test que falla** — agregar dentro de `describe('allowedRolesForPathname')`:

```ts
	it('grants /attendance/student to admin and preceptor', () => {
		expect(allowedRolesForPathname('/attendance/student')).toEqual([
			ROLES.ADMIN,
			ROLES.PRECEPTOR,
		]);
		expect(allowedRolesForPathname('/attendance/student/abc')).toEqual([
			ROLES.ADMIN,
			ROLES.PRECEPTOR,
		]);
	});
```

- [ ] **Step 2: Correr el test** — `pnpm --filter @repo/common test` → debe fallar (devuelve los 4 roles).

- [ ] **Step 3: Implementar** — en `nav.ts`, insertar después de la regla de `/attendance/subject` (línea 151):

```ts
	if (pathname.startsWith('/attendance/student'))
		return [ROLES.ADMIN, ROLES.PRECEPTOR];
```

- [ ] **Step 4: Correr el test** — `pnpm --filter @repo/common test` → verde.

- [ ] **Step 5: Commit** — `git commit -m "feat(common): restrict /attendance/student to admin and preceptor"`

---

## Task 2: Helpers puros `student-history.ts`

**Files:**

- Create: `packages/ui/src/lib/student-history.ts`
- Test: `packages/ui/src/lib/student-history.test.ts`

**Contexto:** D2/D5 y el cálculo de comparación. Todo puro y testeable.

- [ ] **Step 1: Escribir los tests que fallan** — `student-history.test.ts`:

```ts
import { ATTENDANCE_STATUS, type AttendanceRecord } from '@repo/common';
import { describe, expect, it } from 'vitest';
import {
	buildStudentCourseComparison,
	buildSubjectBreakdown,
	studentAttendanceFromAbsencePercent,
	tallyAttendance,
} from './student-history';

function record(
	status: AttendanceRecord['status'],
	subjectId?: string,
): AttendanceRecord {
	return { id: `${status}-${subjectId ?? 'none'}`, studentId: 's1', studentName: 'A', status, subjectId };
}

describe('tallyAttendance', () => {
	it('cuenta cada estado y calcula asistencia como (present + late) / total', () => {
		const tally = tallyAttendance([
			record(ATTENDANCE_STATUS.PRESENT),
			record(ATTENDANCE_STATUS.PRESENT),
			record(ATTENDANCE_STATUS.LATE),
			record(ATTENDANCE_STATUS.ABSENT),
			record(ATTENDANCE_STATUS.JUSTIFIED),
		]);
		expect(tally).toEqual({ present: 2, absent: 1, late: 1, justified: 1, total: 5, attendancePercent: 60 });
	});

	it('devuelve null cuando no hay registros', () => {
		expect(tallyAttendance([]).attendancePercent).toBeNull();
	});
});

describe('buildSubjectBreakdown', () => {
	it('agrupa por materia y usa Asistencia diaria sin subjectId', () => {
		const rows = buildSubjectBreakdown(
			[record(ATTENDANCE_STATUS.PRESENT, 'm1'), record(ATTENDANCE_STATUS.PRESENT), record(ATTENDANCE_STATUS.ABSENT, 'm1')],
			[{ id: 'm1', name: 'Matemática', area: 'x', weeklyHours: 4 }],
		);
		const math = rows.find((r) => r.key === 'm1');
		const daily = rows.find((r) => r.name === 'Asistencia diaria');
		expect(math).toMatchObject({ name: 'Matemática', present: 1, absent: 1, total: 2, attendancePercent: 50 });
		expect(daily).toMatchObject({ present: 1, total: 1 });
	});
});

describe('studentAttendanceFromAbsencePercent', () => {
	it('convierte inasistencia en asistencia y preserva null', () => {
		expect(studentAttendanceFromAbsencePercent(25)).toBe(75);
		expect(studentAttendanceFromAbsencePercent(null)).toBeNull();
	});
});

describe('buildStudentCourseComparison', () => {
	it('une por año-mes, ordena y normaliza ratios del curso', () => {
		const points = buildStudentCourseComparison(
			[{ month: 3, year: 2026, present: 0, absent: 0, late: 0, justified: 0, absencePercent: 20, status: 'ok' }],
			[{ month: 3, year: 2026, averageAttendance: 0.9 }],
		);
		expect(points).toHaveLength(1);
		expect(points[0]?.alumno).toBe(80);
		expect(points[0]?.curso).toBe(90);
	});
});
```

- [ ] **Step 2: Correr** — `pnpm --filter @repo/ui test` → fallan por módulo ausente.

- [ ] **Step 3: Implementar** `student-history.ts` (código exacto):

```ts
import {
	ATTENDANCE_STATUS,
	type AttendanceRecord,
	type AttendanceStatus,
	type CourseSummaryEntry,
	isLateStatus,
	type ISubjectResponse,
	type StudentMonthlyEntry,
} from '@repo/common';
import { formatMonthLabel } from './format';

export interface AttendanceStatusMeta {
	label: string;
	className: string;
}

export const ATTENDANCE_STATUS_META: Record<AttendanceStatus, AttendanceStatusMeta> = {
	[ATTENDANCE_STATUS.PRESENT]: {
		label: 'Presente',
		className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
	},
	[ATTENDANCE_STATUS.ABSENT]: {
		label: 'Ausente',
		className: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
	},
	[ATTENDANCE_STATUS.LATE]: {
		label: 'Tarde',
		className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
	},
	[ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE]: {
		label: 'Tarde (fuera de tolerancia)',
		className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
	},
	[ATTENDANCE_STATUS.JUSTIFIED]: {
		label: 'Justificada',
		className: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30',
	},
};

export interface AttendanceTally {
	present: number;
	absent: number;
	late: number;
	justified: number;
	total: number;
	/** (present + late) / total * 100. Null when there are no records. */
	attendancePercent: number | null;
}

export const DAILY_SUBJECT_KEY = '__daily__';
export const DAILY_SUBJECT_LABEL = 'Asistencia diaria';
export const UNKNOWN_SUBJECT_LABEL = 'Materia sin nombre';

export function tallyAttendance(records: AttendanceRecord[]): AttendanceTally {
	let present = 0;
	let absent = 0;
	let late = 0;
	let justified = 0;
	for (const record of records) {
		if (record.status === ATTENDANCE_STATUS.PRESENT) present += 1;
		else if (record.status === ATTENDANCE_STATUS.ABSENT) absent += 1;
		else if (isLateStatus(record.status)) late += 1;
		else if (record.status === ATTENDANCE_STATUS.JUSTIFIED) justified += 1;
	}
	const total = present + absent + late + justified;
	const attendancePercent = total === 0 ? null : ((present + late) / total) * 100;
	return { present, absent, late, justified, total, attendancePercent };
}

export interface SubjectBreakdown extends AttendanceTally {
	key: string;
	name: string;
}

export function buildSubjectNameMap(
	subjects: ISubjectResponse[],
): Map<string, string> {
	return new Map(subjects.map((subject) => [subject.id, subject.name]));
}

export function buildSubjectBreakdown(
	records: AttendanceRecord[],
	subjects: ISubjectResponse[],
): SubjectBreakdown[] {
	const nameById = buildSubjectNameMap(subjects);
	const groups = new Map<string, AttendanceRecord[]>();
	for (const record of records) {
		const key = record.subjectId ?? DAILY_SUBJECT_KEY;
		const list = groups.get(key);
		if (list) list.push(record);
		else groups.set(key, [record]);
	}
	return [...groups.entries()]
		.map(([key, list]) => ({
			key,
			name:
				key === DAILY_SUBJECT_KEY
					? DAILY_SUBJECT_LABEL
					: (nameById.get(key) ?? UNKNOWN_SUBJECT_LABEL),
			...tallyAttendance(list),
		}))
		.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'es'));
}

export interface ComparisonPoint {
	label: string;
	alumno: number | null;
	curso: number | null;
}

/** Student attendance derived from the report's absence percentage (authoritative). */
export function studentAttendanceFromAbsencePercent(
	absencePercent: number | null,
): number | null {
	if (absencePercent === null) return null;
	return Math.min(100, Math.max(0, 100 - absencePercent));
}

/** The course summary may deliver a ratio (0..1) or a percentage; normalize to 0..100. */
function normalizeCourseAttendance(value: number): number {
	return value < 1 ? value * 100 : value;
}

export function buildStudentCourseComparison(
	studentMonths: StudentMonthlyEntry[],
	courseMonths: CourseSummaryEntry[],
): ComparisonPoint[] {
	const studentByKey = new Map(
		studentMonths.map((entry) => [
			`${entry.year}-${entry.month}`,
			studentAttendanceFromAbsencePercent(entry.absencePercent),
		]),
	);
	return [...courseMonths]
		.sort((a, b) => a.year - b.year || a.month - b.month)
		.map((entry) => ({
			label: `${formatMonthLabel(entry.month, 'short')} ${entry.year}`,
			alumno: studentByKey.get(`${entry.year}-${entry.month}`) ?? null,
			curso:
				entry.averageAttendance === null
					? null
					: normalizeCourseAttendance(entry.averageAttendance),
		}))
		.filter((point) => point.alumno !== null || point.curso !== null);
}

function recordTime(record: AttendanceRecord): number {
	if (!record.date) return 0;
	const time = new Date(record.date).getTime();
	return Number.isNaN(time) ? 0 : time;
}

export function sortRecordsDesc(records: AttendanceRecord[]): AttendanceRecord[] {
	return [...records].sort((a, b) => recordTime(b) - recordTime(a));
}
```

- [ ] **Step 4: Verificar `formatMonthLabel` acepta `'short'`.** Si su firma es `(month: number, style?: ...)`, dejar como está; si no acepta `'short'`, usar `formatMonthLabel(entry.month)` y ajustar el test a `label` sin sufijo de estilo. (Leer `packages/ui/src/lib/format.ts`.)

- [ ] **Step 5: Correr** — `pnpm --filter @repo/ui test` → verde.

- [ ] **Step 6: Commit** — `git commit -m "feat(ui): add pure student-history helpers"`

---

## Task 3: `StudentCourseComparisonChart`

**Files:**

- Create: `packages/ui/src/components/features/reports/student-history/student-course-comparison-chart.tsx`
- Test: `.../student-course-comparison-chart.test.tsx`

- [ ] **Step 1: Test que falla**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StudentCourseComparisonChart } from './student-course-comparison-chart';

describe('StudentCourseComparisonChart', () => {
	it('muestra el título y el vacío cuando no hay meses', () => {
		render(<StudentCourseComparisonChart studentMonths={[]} courseMonths={[]} />);
		expect(screen.getByText('Alumno vs. curso')).toBeTruthy();
		expect(screen.getByText('Aún no hay meses comparables')).toBeTruthy();
	});
});
```

- [ ] **Step 2: Correr** → falla (módulo ausente).

- [ ] **Step 3: Implementar** — componente `'use client'` con `Card`, `ChartContainer` (jsdom no
  necesita tamaño real; `ResponsiveContainer` renderiza 0 height pero el título/vacío sí se pueden
  testear). Recharts: `LineChart` con dos `Line` (`curso` punteada, `alumno` sólida), `XAxis`
  `dataKey="label"`, `YAxis` `domain={[0,100]}` `tickFormatter={(v) => `${v}%`}`, tooltip y leyenda
  de `ui/chart`. Estado `isLoading` → `Skeleton`. Usar `buildStudentCourseComparison`.

- [ ] **Step 4: Correr** → verde.

- [ ] **Step 5: Commit** — `git commit -m "feat(ui): add student vs course comparison chart"`

---

## Task 4: `StudentSubjectBreakdown`

**Files:**

- Create: `.../student-history/student-subject-breakdown.tsx` + `.test.tsx`

- [ ] **Step 1: Test que falla** — renderizar con dos materias y verificar que aparece el nombre de
  la materia y el porcentaje formateado (`50%`), y que aparece "Asistencia diaria" cuando hay
  registros sin `subjectId`.

- [ ] **Step 2: Correr** → falla.

- [ ] **Step 3: Implementar** — `Card` + lista `divide-y`; por fila: nombre (o `UNKNOWN_SUBJECT_LABEL`),
  línea secundaria `P {present} · A {absent} · T {late} · J {justified}`, y a la derecha
  `formatPercent(attendancePercent)`. Vacío → `EmptyState`. `isLoading` → `Skeleton`. Compute con
  `buildSubjectBreakdown(records, subjects)`.

- [ ] **Step 4: Correr** → verde.

- [ ] **Step 5: Commit** — `git commit -m "feat(ui): add per-subject attendance breakdown"`

---

## Task 5: `StudentAttendanceHistory`

**Files:**

- Create: `.../student-history/student-attendance-history.tsx` + `.test.tsx`

- [ ] **Step 1: Test que falla** — con un registro `PRESENT` con `date` y `justification` ausente:
  verificar que aparece la fecha formateada y el badge "Presente". Con un registro `JUSTIFIED` con
  `justification.reason = 'Certificado médico'`: verificar el texto `Justificación: Certificado médico`.

- [ ] **Step 2: Correr** → falla.

- [ ] **Step 3: Implementar** — `Card` + contenedor `max-h-[28rem] overflow-y-auto`; filas con
  `sortRecordsDesc(records)`; cada fila: `formatDate(record.date)` o `'—'`, nombre de materia
  (`buildSubjectNameMap` + `DAILY_SUBJECT_LABEL`/`UNKNOWN_SUBJECT_LABEL`), badge con
  `ATTENDANCE_STATUS_META[record.status]`, y la justificación si existe. Vacío → `EmptyState`.

- [ ] **Step 4: Correr** → verde.

- [ ] **Step 5: Commit** — `git commit -m "feat(ui): add student attendance history list"`

---

## Task 6: `StudentHistoryPage` + barrels

**Files:**

- Create: `.../student-history/student-history-page.tsx` + `.test.tsx` + `index.ts`
- Modify: `packages/ui/src/components/features/reports/index.ts`
- Modify: `packages/ui/src/index.tsx` (agregar `export * from './lib/student-history';`)

- [ ] **Step 1: Test que falla** — renderizar con un alumno y verificar el nombre del alumno, el DNI
  y los títulos de sección (`Asistencia por materia`, `Historial de asistencia`, `Alumno vs. curso`).

- [ ] **Step 2: Correr** → falla.

- [ ] **Step 3: Implementar** la composición con **secciones independientes** (D3):
  - Encabezado custom: botón volver (`ArrowLeft`), `Avatar` + iniciales, nombre/DNI/curso/ciclo, y a
    la derecha `ReportStatusBadge` (si hay report) + `ExportActions`.
  - Métricas: 4 `MetricCard` — Presentes (`CheckCircle2`, success), Inasistencias (`XCircle`,
    destructive; usa `formatCount` si viene del report), Tardanzas (`Clock`, warning), Promedio de
    inasistencia (`Percent`). Valores desde `report.totals` si existe; si no, desde
    `tallyAttendance(history)` (inasistencia derivada de `attendancePercent`).
  - Card con `MonthlyProgressBars entries={report?.months ?? []}`.
  - `StudentCourseComparisonChart studentMonths={report?.months ?? []} courseMonths={summary?.months ?? []}`.
  - `StudentSubjectBreakdown records={history} subjects={subjects}`.
  - Card de alertas: `<StudentAlertsSummary alerts={alerts} isLoading={isLoadingAlerts} />`.
  - `StudentAttendanceHistory records={history} subjects={subjects}`.

  Props exactas:

```ts
export interface StudentHistoryPageProps {
	student: IStudentDetailResponse | null;
	academicYearLabel: string;
	report: StudentReport | null;
	isLoadingReport?: boolean;
	summary: CourseSummary | null;
	isLoadingSummary?: boolean;
	alerts: Alert[];
	isLoadingAlerts?: boolean;
	history: AttendanceRecord[];
	isLoadingHistory?: boolean;
	subjects: ISubjectResponse[];
	onBack: () => void;
	onExport: (format: ExportFormat) => unknown;
	pendingExport: ExportFormat | null;
	exportDisabled?: boolean;
}
```

- [ ] **Step 4: Correr** — `pnpm --filter @repo/ui test` → verde. `pnpm --filter @repo/ui ts:check`.

- [ ] **Step 5: Commit** — `git commit -m "feat(ui): add student history page composition"`

---

## Task 7: Página cliente `/attendance/student/[id]`

**Files:**

- Create: `apps/client/src/app/(dashboard)/attendance/student/[id]/page.tsx`

- [ ] **Step 1: Implementar** la página `'use client'` que:
  - Lee `params = useParams()`, `studentId` como en `students/[id]/page.tsx`.
  - `useStudent`, `useActiveAcademicYear`, `useStudentReport`, `useCourseSummary({ courseId: student?.courseId })`,
    `useSubjects(student?.courseId)`, `useAlertsByStudent`, `useAttendanceHistory({ studentId, from, to })`
    con `from/to` = `activeYear.startDate`/`endDate` normalizados a `YYYY-MM-DD`.
  - Export: `useExportExcel`/`useExportPdf` con `pendingExport`, payload
    `{ courseId: student.courseId, month, year, type: 'student', studentId }` donde `month`/`year`
    surgen del ciclo activo (mes 1 + `activeYear.year`); `toast` en éxito/error.
  - `onBack` → `router.push(\`/students/${studentId}\`)`.
  - Renderiza `StudentHistoryPage` o `LoadingSpinner`/`ErrorState` según `useStudent`.

- [ ] **Step 2: Verificar** — `pnpm --filter client ts:check` (o el script equivalente del workspace).

- [ ] **Step 3: Commit** — `git commit -m "feat(client): add student history page route"`

---

## Task 8: Nombre de archivo de exportación del alumno

**Files:**

- Create: `apps/api/src/modules/reporting/domain/services/export-filename.service.ts`
- Test: `apps/api/test/unit/reporting/export-filename.service.spec.ts`
- Modify: `apps/api/src/modules/reporting/presentation/controllers/export.controller.ts`

- [ ] **Step 1: Test que falla** (jest) — `export-filename.service.spec.ts`:
  - `buildExportFilename({ extension:'xlsx', month:7, year:2026, type:'monthly', courseName:'4° 2 - MORNING' })`
    → `asistencia-4-2-morning-julio-2026.xlsx` (mismo comportamiento actual).
  - `buildExportFilename({ extension:'pdf', month:1, year:2026, type:'student', studentName:'García, Juan' })`
    → `legajo-garc-a-juan-2026.pdf` (o el slug esperado según la implementación).
  - Sin nombre → fallback `estudiante` / `curso`.

- [ ] **Step 2: Correr** — `pnpm --filter api test export-filename` → falla.

- [ ] **Step 3: Implementar** la función pura (mueve `MONTHS` desde el controlador):

```ts
export const MONTHS = [/* enero..diciembre */];

export interface BuildExportFilenameInput {
	extension: 'xlsx' | 'pdf';
	month: number;
	year: number;
	type?: 'monthly' | 'student';
	courseName?: string | null;
	studentName?: string | null;
}

function slugify(value: string | null | undefined, fallback: string): string {
	const slug = (value ?? '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
	return slug || fallback;
}

export function buildExportFilename({
	extension,
	month,
	year,
	type = 'monthly',
	courseName,
	studentName,
}: BuildExportFilenameInput): string {
	if (type === 'student') {
		return `legajo-${slugify(studentName, 'estudiante')}-${year}.${extension}`;
	}
	return `asistencia-${slugify(courseName, 'curso')}-${MONTHS[month - 1] ?? month}-${year}.${extension}`;
}
```

- [ ] **Step 4: Modificar el controlador** — inyectar `@Inject('IStudentPort') studentPort`, y en
  `buildFilename` pasar `type`/`studentId` del DTO; resolver `studentName` con `findStudent` sólo
  para `type === 'student'`; delegar en `buildExportFilename`. Mantener `MONTHS` importado del
  servicio (borrar la copia local).

- [ ] **Step 5: Correr** — `pnpm --filter api test export-filename` y `pnpm --filter api test reporting` → verde.

- [ ] **Step 6: Commit** — `git commit -m "fix(api): name student export file after the student"`

---

## Task 9: Verificación final y documentación

- [ ] **Step 1:** `pnpm turbo run ts:check` (o `pnpm -r ts:check`).
- [ ] **Step 2:** `pnpm -r test` (o `turbo run test`).
- [ ] **Step 3:** `pnpm biome check .` — sin errores nuevos.
- [ ] **Step 4:** Escribir `odd/tasks/student-history-metrics.md` con el checklist final, evidencia
  de cada verificación y el estado (hecho/pendiente). Guardar el mirror en Engram
  (`odd/student-history-metrics/tasks`).
- [ ] **Step 5:** Commit de docs — `git commit -m "docs: record student history metrics tasks and verification"`

---

## Verification (comandos)

| Comando                       | Alcance              |
| ----------------------------- | -------------------- |
| `pnpm --filter @repo/common test` | nav rules        |
| `pnpm --filter @repo/ui test`     | helpers + componentes |
| `pnpm --filter api test`          | export filename  |
| `pnpm turbo run ts:check`         | tipos de todos los paquetes |
| `pnpm biome check .`              | lint             |

## Notas de riesgo

- La lista del historial no se virtualiza (R4); aceptable para un ciclo lectivo.
- La asistencia simple por materia (D5) puede diferir del cálculo ponderado del backend; ambas
  cifras se distinguen en la UI.
