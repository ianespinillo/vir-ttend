'use client';

import type {
	AvailableReportPeriod,
	CourseSummaryEntry,
	ExportFormat,
	ICourseResponse,
	MonthlyReport,
} from '@repo/common';
import { FileBarChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../ui/card';
import { EmptyState } from '../../../shared/empty-state';
import { ExportActions } from './export-actions';
import { MonthlyAttendanceTrendChart } from './monthly-attendance-trend-chart';
import { MonthlyReportTable } from './monthly-report-table';
import { ReportFilters, type ReportFiltersState } from './report-filters';
import { ReportSummaryCards } from './report-summary-cards';

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

function GeneratePeriodEmptyState({
	isGenerating,
	onGenerate,
}: Pick<MonthlyReportProps, 'isGenerating' | 'onGenerate'>) {
	return (
		<EmptyState
			icon={<FileBarChart className="h-6 w-6" />}
			title="Todavía no hay un reporte para este período"
			description="Generá el reporte del mes actual. Los meses anteriores se crean a medida que se registra asistencia; el botón habilita solo el mes en curso."
			actionLabel={isGenerating ? 'Generando...' : 'Generar reporte del mes'}
			onAction={isGenerating ? undefined : onGenerate}
		/>
	);
}

export function MonthlyReport({
	filters,
	onCourseChange,
	onPeriodChange,
	courses,
	periods,
	report,
	trendMonths,
	isLoadingCourses,
	isLoadingPeriods,
	isLoadingReport,
	isLoadingTrend,
	onGenerate,
	isGenerating,
	onExport,
	pendingExport,
}: MonthlyReportProps) {
	if (!filters.courseId) {
		return (
			<EmptyState
				icon={<FileBarChart className="h-6 w-6" />}
				title="Elegí un curso para ver su reporte"
				description="Seleccioná un curso y un mes en los filtros de arriba."
			/>
		);
	}

	const hasPeriod = Boolean(filters.month && filters.year);

	return (
		<div className="space-y-6">
			<ReportFilters
				courses={courses}
				periods={periods}
				value={filters}
				onCourseChange={onCourseChange}
				onPeriodChange={onPeriodChange}
				isLoadingCourses={isLoadingCourses}
				isLoadingPeriods={isLoadingPeriods}
			/>

			{hasPeriod && periods.length === 0 && !isLoadingPeriods ? (
				<GeneratePeriodEmptyState
					isGenerating={isGenerating}
					onGenerate={onGenerate}
				/>
			) : (
				<>
					<ReportSummaryCards
						summary={report?.summary ?? null}
						workingDays={report?.workingDays}
						isLoading={isLoadingReport}
					/>

					<Card>
						<CardHeader className="flex-row items-center justify-between">
							<CardTitle className="text-base">Detalle por alumno</CardTitle>
							{report && (
								<ExportActions
									onExport={onExport}
									pendingFormat={pendingExport}
									disabled={isLoadingReport || isGenerating}
								/>
							)}
						</CardHeader>
						<CardContent>
							{!isLoadingReport && !report ? (
								<GeneratePeriodEmptyState
									isGenerating={isGenerating}
									onGenerate={onGenerate}
								/>
							) : (
								<MonthlyReportTable
									students={report?.students ?? []}
									isLoading={isLoadingReport}
								/>
							)}
						</CardContent>
					</Card>

					<MonthlyAttendanceTrendChart
						months={trendMonths}
						isLoading={isLoadingTrend}
					/>
				</>
			)}
		</div>
	);
}
