'use client';

import type { MonthlyReport } from '@repo/common';
import {
	AlertTriangle,
	CalendarDays,
	ShieldAlert,
	TrendingUp,
} from 'lucide-react';
import { formatPercent } from '../../../../lib/format';
import { Skeleton } from '../../../../ui/skeleton';
import { MetricCard } from '../../attendance/attendance-summary/metric-card';

export interface ReportSummaryCardsProps {
	summary?: MonthlyReport['summary'] | null;
	workingDays?: number;
	isLoading?: boolean;
}

export function ReportSummaryCards({
	summary,
	workingDays,
	isLoading,
}: ReportSummaryCardsProps) {
	if (isLoading) {
		const skeletonKeys = ['asistencia', 'riesgo', 'excedido', 'dias'] as const;

		return (
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{skeletonKeys.map((key) => (
					<Skeleton key={key} className="h-[92px] rounded-xl animate-pulse" />
				))}
			</div>
		);
	}

	const rawAttendance = summary?.averageAttendance;
	const isNaNAttendance =
		typeof rawAttendance === 'number' && Number.isNaN(rawAttendance);
	const normalizedAttendance =
		rawAttendance === null || rawAttendance === undefined || isNaNAttendance
			? rawAttendance
			: rawAttendance <= 1 && rawAttendance > 0
				? rawAttendance * 100
				: rawAttendance;

	const attendanceDisplay =
		summary === null || summary === undefined
			? '—'
			: isNaNAttendance
				? '-'
				: formatPercent(normalizedAttendance);

	const studentsAtRiskDisplay =
		summary === null || summary === undefined
			? 0
			: typeof summary.studentsAtRisk === 'number' &&
					Number.isNaN(summary.studentsAtRisk)
				? '-'
				: (summary.studentsAtRisk ?? 0);

	const studentsExceededDisplay =
		summary === null || summary === undefined
			? 0
			: typeof summary.studentsExceeded === 'number' &&
					Number.isNaN(summary.studentsExceeded)
				? '-'
				: (summary.studentsExceeded ?? 0);

	const workingDaysDisplay =
		typeof workingDays === 'number' && Number.isNaN(workingDays)
			? '-'
			: (workingDays ?? 0);

	return (
		<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
			<MetricCard
				title="Asistencia promedio"
				value={attendanceDisplay}
				icon={TrendingUp}
				variant="success"
			/>
			<MetricCard
				title="Alumnos en riesgo"
				value={studentsAtRiskDisplay}
				subtitle="umbral 75%"
				icon={AlertTriangle}
				variant="warning"
			/>
			<MetricCard
				title="Umbral excedido"
				value={studentsExceededDisplay}
				subtitle="umbral 85%"
				icon={ShieldAlert}
				variant="destructive"
			/>
			<MetricCard
				title="Días hábiles"
				value={workingDaysDisplay}
				icon={CalendarDays}
			/>
		</div>
	);
}
