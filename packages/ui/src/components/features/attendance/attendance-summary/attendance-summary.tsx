'use client';

import type { AttendanceMetrics } from '@repo/common';
import {
	AlertTriangle,
	CheckCircle2,
	Clock,
	FileCheck2,
	Users,
	XCircle,
} from 'lucide-react';
import { MetricCard } from './metric-card';

export interface AttendanceSummaryProps {
	metrics?: AttendanceMetrics | null;
	isLoading?: boolean;
}

export function AttendanceSummary({
	metrics,
	isLoading,
}: AttendanceSummaryProps) {
	if (isLoading) {
		return (
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
				{[1, 2, 3, 4, 5].map((item) => (
					<div
						key={item}
						className="h-20 bg-muted/60 animate-pulse rounded-xl border border-border/40"
					/>
				))}
			</div>
		);
	}

	if (!metrics) return null;

	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
				<MetricCard
					title="Total Alumnos"
					value={metrics.totalStudents}
					icon={Users}
					variant="default"
				/>
				<MetricCard
					title="Presentes"
					value={metrics.present}
					icon={CheckCircle2}
					variant="success"
				/>
				<MetricCard
					title="Ausentes"
					value={metrics.absent}
					subtitle={`${(metrics.absent / metrics.totalStudents) * 100}%`}
					icon={XCircle}
					variant="destructive"
				/>
				<MetricCard
					title="Tardanzas"
					value={metrics.late}
					icon={Clock}
					variant="warning"
				/>
				<MetricCard
					title="Justificados"
					value={metrics.justified}
					icon={FileCheck2}
					variant="info"
				/>
			</div>

			{metrics.studentsAtRisk && metrics.studentsAtRisk.length > 0 && (
				<div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 dark:text-amber-200 text-xs">
					<AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
					<span>
						<strong>Atención:</strong> {metrics.studentsAtRisk.length} alumno(s)
						superan el umbral de inasistencias en este curso.
					</span>
				</div>
			)}
		</div>
	);
}
