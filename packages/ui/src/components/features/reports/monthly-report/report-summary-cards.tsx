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

	return (
		<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
			<MetricCard
				title="Asistencia promedio"
				value={summary ? formatPercent(summary.averageAttendance) : '—'}
				icon={TrendingUp}
				variant="success"
			/>
			<MetricCard
				title="Alumnos en riesgo"
				value={summary?.studentsAtRisk ?? 0}
				subtitle="umbral 75%"
				icon={AlertTriangle}
				variant="warning"
			/>
			<MetricCard
				title="Umbral excedido"
				value={summary?.studentsExceeded ?? 0}
				subtitle="umbral 85%"
				icon={ShieldAlert}
				variant="destructive"
			/>
			<MetricCard
				title="Días hábiles"
				value={workingDays ?? 0}
				icon={CalendarDays}
			/>
		</div>
	);
}
