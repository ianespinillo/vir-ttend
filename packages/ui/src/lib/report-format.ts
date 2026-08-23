import type {
	AvailableReportPeriod,
	CourseSummaryEntry,
	StudentReportStatus,
} from '@repo/common';
import { ATTENDANCE_THRESHOLDS } from '@repo/common';
import { formatMonthLabel } from './format';

export interface TrendPoint {
	label: string;
	asistencia: number;
}

export const REPORT_STATUS_META: Record<
	StudentReportStatus,
	{ label: string; description: string; badgeClass: string }
> = {
	ok: {
		label: 'Alto rendimiento',
		description: 'Asistencia dentro de los parámetros esperados.',
		badgeClass:
			'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
	},
	'at-risk': {
		label: 'En riesgo',
		description: 'Ausencias que superan el umbral de advertencia.',
		badgeClass:
			'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
	},
	exceeded: {
		label: 'Umbral excedido',
		description: 'Ausencias por encima del límite permitido.',
		badgeClass:
			'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
	},
};

export const REPORT_ALERT_META: Record<
	string,
	{ label: string; iconClass: string }
> = {
	warning: {
		label: 'Advertencia',
		iconClass: 'text-amber-600 bg-amber-500/15 dark:text-amber-400',
	},
	critical: {
		label: 'Crítico',
		iconClass: 'text-rose-600 bg-rose-500/15 dark:text-rose-400',
	},
	exceeded: {
		label: 'Umbral excedido',
		iconClass: 'text-rose-600 bg-rose-500/15 dark:text-rose-400',
	},
};

type Tone = 'ok' | 'warning' | 'critical';

function getTone(absencePercent: number): Tone {
	if (absencePercent >= ATTENDANCE_THRESHOLDS.CRITICAL) return 'critical';
	if (absencePercent >= ATTENDANCE_THRESHOLDS.WARNING) return 'warning';
	return 'ok';
}

const TEXT_TONES: Record<Tone, string> = {
	ok: 'text-emerald-600 dark:text-emerald-400',
	warning: 'text-amber-600 dark:text-amber-400',
	critical: 'text-rose-600 dark:text-rose-400',
};

const BAR_TONES: Record<Tone, string> = {
	ok: 'bg-emerald-500',
	warning: 'bg-amber-500',
	critical: 'bg-rose-500',
};

export function getAbsencePercentTone(absencePercent: number): string {
	return TEXT_TONES[getTone(absencePercent)];
}

export function getAttendanceBarTone(absencePercent: number): string {
	return BAR_TONES[getTone(absencePercent)];
}

export function getStatusTooltip(
	status: StudentReportStatus,
	absencePercent?: number,
): string {
	const base =
		status === 'ok'
			? `Ausencias por debajo del umbral de advertencia (${ATTENDANCE_THRESHOLDS.WARNING}%).`
			: status === 'at-risk'
				? `Ausencias entre el ${ATTENDANCE_THRESHOLDS.WARNING}% y el ${ATTENDANCE_THRESHOLDS.CRITICAL}% del total de clases.`
				: `Ausencias por encima del umbral crítico (${ATTENDANCE_THRESHOLDS.CRITICAL}%).`;

	return absencePercent === undefined
		? base
		: `${base} Actual: ${absencePercent.toFixed(1)}%.`;
}

export function buildTrendChartData(
	months: CourseSummaryEntry[],
): TrendPoint[] {
	return [...months]
		.sort((a, b) => a.year - b.year || a.month - b.month)
		.map((entry) => ({
			label: `${formatMonthLabel(entry.month, 'short')} ${entry.year}`,
			asistencia: entry.averageAttendance,
		}));
}

export function sortPeriodsDesc(
	periods: AvailableReportPeriod[],
): AvailableReportPeriod[] {
	return [...periods].sort((a, b) => b.year - a.year || b.month - a.month);
}
