'use client';

import {
	type Alert,
	type AttendanceRecord,
	type CourseSummary,
	type ExportFormat,
	type IStudentDetailResponse,
	type ISubjectResponse,
	type StudentReport,
	formatCount,
} from '@repo/common';
import { ArrowLeft, CheckCircle2, Clock, Percent, XCircle } from 'lucide-react';
import { formatPercent } from '../../../../lib/format';
import { localizeCourseName } from '../../../../lib/shift';
import { tallyAttendance } from '../../../../lib/student-history';
import { Avatar, AvatarFallback } from '../../../../ui/avatar';
import { Button } from '../../../../ui/button';
import { Card, CardContent } from '../../../../ui/card';
import { Skeleton } from '../../../../ui/skeleton';
import { StudentAlertsSummary } from '../../alerts/student-alerts-summary';
import { MetricCard } from '../../attendance/attendance-summary/metric-card';
import { ExportActions } from '../monthly-report/export-actions';
import { ReportStatusBadge } from '../shared';
import { MonthlyProgressBars } from '../student-report/monthly-progress-bars';
import { StudentAttendanceHistory } from './student-attendance-history';
import { StudentCourseComparisonChart } from './student-course-comparison-chart';
import { StudentSubjectBreakdown } from './student-subject-breakdown';

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

function getInitials(fullName: string): string {
	return fullName
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? '')
		.join('');
}

export function StudentHistoryPage({
	student,
	academicYearLabel,
	report,
	isLoadingReport,
	summary,
	isLoadingSummary,
	alerts,
	isLoadingAlerts,
	history,
	isLoadingHistory,
	subjects,
	onBack,
	onExport,
	pendingExport,
	exportDisabled,
}: StudentHistoryPageProps) {
	const totals = report?.totals;
	const tally = tallyAttendance(history);

	const present = totals?.present ?? tally.present;
	const late = totals?.late ?? tally.late;
	const absent = totals ? formatCount(totals.absent) : tally.absent;
	const absencePercent = totals
		? totals.averageAbsencePercent
		: tally.attendancePercent === null
			? null
			: 100 - tally.attendancePercent;
	const absenceSubtitle = totals ? `de ${totals.totalDays} días` : undefined;

	return (
		<div className="space-y-6">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex min-w-0 items-center gap-3">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={onBack}
						aria-label="Volver"
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<Avatar className="h-12 w-12 border border-border">
						<AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
							{student ? getInitials(student.fullName) : '—'}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0">
						<h1 className="truncate text-xl font-semibold tracking-tight">
							{student?.fullName ?? 'Alumno'}
						</h1>
						<p className="truncate text-sm text-muted-foreground">
							{student
								? `${student.documentNumber} • ${localizeCourseName(student.courseName)}`
								: '—'}
							{academicYearLabel ? ` • Ciclo ${academicYearLabel}` : ''}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{report && (
						<ReportStatusBadge
							status={report.status}
							absencePercent={report.totals.averageAbsencePercent}
						/>
					)}
					<ExportActions
						onExport={onExport}
						pendingFormat={pendingExport}
						disabled={exportDisabled}
					/>
				</div>
			</header>

			{isLoadingReport && isLoadingHistory ? (
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					{['presentes', 'ausentes', 'tardanzas', 'promedio'].map((key) => (
						<Skeleton key={key} className="h-[92px] rounded-xl animate-pulse" />
					))}
				</div>
			) : (
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					<MetricCard
						title="Presentes"
						value={present}
						icon={CheckCircle2}
						variant="success"
					/>
					<MetricCard
						title="Inasistencias"
						value={absent}
						subtitle={
							totals?.absenceBreakdown
								? `turno ${formatCount(totals.absenceBreakdown.daily)} · taller ${formatCount(totals.absenceBreakdown.workshop)}`
								: undefined
						}
						icon={XCircle}
						variant="destructive"
					/>
					<MetricCard
						title="Tardanzas"
						value={late}
						icon={Clock}
						variant="warning"
					/>
					<MetricCard
						title="Promedio de inasistencia"
						value={formatPercent(absencePercent)}
						subtitle={absenceSubtitle}
						icon={Percent}
					/>
				</div>
			)}

			<Card>
				<CardContent className="p-5">
					<p className="mb-4 text-sm font-medium">Asistencia mensual del alumno</p>
					<MonthlyProgressBars entries={report?.months ?? []} />
				</CardContent>
			</Card>

			<StudentCourseComparisonChart
				studentMonths={report?.months ?? []}
				courseMonths={summary?.months ?? []}
				isLoading={isLoadingReport || isLoadingSummary}
			/>

			<StudentSubjectBreakdown
				records={history}
				subjects={subjects}
				isLoading={isLoadingHistory}
			/>

			<Card>
				<CardContent className="p-5">
					<p className="mb-4 text-sm font-medium">Alertas del alumno</p>
					<StudentAlertsSummary alerts={alerts} isLoading={isLoadingAlerts} />
				</CardContent>
			</Card>

			<StudentAttendanceHistory
				records={history}
				subjects={subjects}
				isLoading={isLoadingHistory}
			/>
		</div>
	);
}
