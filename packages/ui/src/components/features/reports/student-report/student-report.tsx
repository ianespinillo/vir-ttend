'use client';

import type { AlertType, StudentReport } from '@repo/common';
import {
	AlertTriangle,
	CheckCircle2,
	Clock,
	Percent,
	ShieldAlert,
	ShieldX,
	UserRound,
	XCircle,
} from 'lucide-react';
import { formatPercent } from '../../../../lib/format';
import {
	REPORT_ALERT_META,
	REPORT_STATUS_META,
} from '../../../../lib/report-format';
import { Avatar, AvatarFallback } from '../../../../ui/avatar';
import { Card, CardContent } from '../../../../ui/card';
import { Skeleton } from '../../../../ui/skeleton';
import { EmptyState } from '../../../shared/empty-state';
import { MetricCard } from '../../attendance/attendance-summary/metric-card';
import { ReportStatusBadge } from '../shared';
import { MonthlyProgressBars } from './monthly-progress-bars';

const ALERT_ICONS: Record<AlertType, typeof AlertTriangle> = {
	warning: AlertTriangle,
	critical: ShieldAlert,
	exceeded: ShieldX,
};

export interface StudentReportProps {
	report: StudentReport | null;
	isLoading?: boolean;
}

function getInitials(fullName: string): string {
	return fullName
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? '')
		.join('');
}

function StudentReportSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-28 w-full rounded-xl animate-pulse" />
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{['presentes', 'ausentes', 'tardanzas', 'promedio'].map((key) => (
					<Skeleton key={key} className="h-[92px] rounded-xl animate-pulse" />
				))}
			</div>
			<Skeleton className="h-48 w-full rounded-xl animate-pulse" />
		</div>
	);
}

export function StudentReport({ report, isLoading }: StudentReportProps) {
	if (isLoading) return <StudentReportSkeleton />;

	if (!report) {
		return (
			<EmptyState
				icon={<UserRound className="h-6 w-6" />}
				title="Sin reportes generados para este alumno"
				description="El reporte individual se genera a partir de la asistencia registrada durante el ciclo lectivo."
			/>
		);
	}

	const meta = REPORT_STATUS_META[report.status];

	return (
		<div className="space-y-6">
			<Card>
				<CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
					<Avatar className="h-12 w-12 border border-border">
						<AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
							{getInitials(report.fullName)}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0 flex-1">
						<p className="truncate font-semibold">{report.fullName}</p>
						<p className="text-sm text-muted-foreground">
							{report.documentNumber} • {report.courseName}
						</p>
					</div>
					<ReportStatusBadge
						status={report.status}
						absencePercent={report.totals.averageAbsencePercent}
					/>
				</CardContent>
				{report.alerts.length > 0 && (
					<CardContent className="flex flex-wrap gap-2 border-t px-5 py-3">
						{report.alerts.map((alert, i) => {
							const alertMeta = REPORT_ALERT_META[alert.status];
							if (!alertMeta) return null;
							const Icon = ALERT_ICONS[alert.status];
							return (
								<span
									key={`${alert.status}-${i}`}
									className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${alertMeta.iconClass}`}
								>
									<Icon className="h-3.5 w-3.5" />
									{alertMeta.label}
								</span>
							);
						})}
					</CardContent>
				)}
			</Card>

			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<MetricCard
					title="Presentes"
					value={report.totals.present}
					icon={CheckCircle2}
					variant="success"
				/>
				<MetricCard
					title="Ausentes"
					value={report.totals.absent}
					icon={XCircle}
					variant="destructive"
				/>
				<MetricCard
					title="Tardanzas"
					value={report.totals.late}
					icon={Clock}
					variant="warning"
				/>
				<MetricCard
					title="Promedio de inasistencia"
					value={formatPercent(report.totals.averageAbsencePercent)}
					subtitle={`de ${report.totals.totalDays} días`}
					icon={Percent}
				/>
			</div>

			<Card>
				<CardContent className="p-5">
					<p
						className={`text-sm font-medium ${meta.badgeClass.split(' ').find((c) => c.startsWith('text-')) ?? ''}`}
					>
						{meta.label}: {meta.description}
					</p>
					<div className="mt-4">
						<MonthlyProgressBars entries={report.months} />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
