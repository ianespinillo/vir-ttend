'use client';

import type { ExportFormat } from '@repo/common';
import {
	useActiveAcademicYear,
	useAvailableReports,
	useCourseSummary,
	useCurrentUser,
	useExportExcel,
	useExportPdf,
	useGenerateReport,
	useMonthlyReport,
	useMyCourses,
} from '@repo/hooks';
import { MonthlyReport, PageHeader, sortPeriodsDesc } from '@repo/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ReportsMonthlyPage() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const initialCourseId = searchParams.get('courseId') || undefined;
	const initialMonth = searchParams.get('month');
	const initialYear = searchParams.get('year');

	const [selectedCourseId, setSelectedCourseId] = useState<string>(
		initialCourseId || '',
	);
	const [selectedPeriod, setSelectedPeriod] = useState<{
		month?: number;
		year?: number;
	}>({
		month: initialMonth ? Number(initialMonth) : undefined,
		year: initialYear ? Number(initialYear) : undefined,
	});

	const updateUrl = useCallback(
		(courseId: string, period: { month?: number; year?: number }) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set('courseId', courseId);
			if (period.month && period.year) {
				params.set('month', String(period.month));
				params.set('year', String(period.year));
			} else {
				params.delete('month');
				params.delete('year');
			}
			router.replace(`${pathname}?${params.toString()}`);
		},
		[router, pathname, searchParams],
	);

	const { data: currentUser } = useCurrentUser();
	const { data: activeYear } = useActiveAcademicYear();

	const isPreceptor = currentUser?.role === 'preceptor';
	const { data: courses, isLoading: isLoadingCourses } = useMyCourses({
		academicYearId: activeYear?.id,
		isPreceptor,
	});

	const courseId = selectedCourseId || undefined;
	const month = selectedPeriod.month;
	const year = selectedPeriod.year;

	const { data: available, isLoading: isLoadingPeriods } =
		useAvailableReports(courseId);
	const periods = available?.periods ?? [];

	const handleCourseChange = useCallback(
		(newCourseId: string) => {
			setSelectedCourseId(newCourseId);
			setSelectedPeriod({});
			updateUrl(newCourseId, {});
		},
		[updateUrl],
	);

	const handlePeriodChange = useCallback(
		(period: { month: number; year: number }) => {
			setSelectedPeriod(period);
			if (courseId) updateUrl(courseId, period);
		},
		[courseId, updateUrl],
	);

	useEffect(() => {
		if (!isLoadingCourses && !courseId && courses && courses.length > 0) {
			const first = courses[0];
			if (first) {
				setSelectedCourseId(first.id);
				updateUrl(first.id, {});
			}
		}
	}, [isLoadingCourses, courseId, courses, updateUrl]);

	useEffect(() => {
		if (!isLoadingPeriods && courseId && periods.length > 0 && !(month && year)) {
			const latest = sortPeriodsDesc(periods)[0];
			if (latest) {
				setSelectedPeriod({ month: latest.month, year: latest.year });
				updateUrl(courseId, { month: latest.month, year: latest.year });
			}
		}
	}, [isLoadingPeriods, courseId, periods, month, year, updateUrl]);

	const { data: report, isLoading: isLoadingReport } = useMonthlyReport({
		courseId,
		month,
		year,
	});

	const { data: summary, isLoading: isLoadingSummary } = useCourseSummary({
		courseId,
		academicYearId: activeYear?.id,
	});

	const generateMutation = useGenerateReport();

	const [pendingExport, setPendingExport] = useState<ExportFormat | null>(null);
	const exportExcelMutation = useExportExcel();
	const exportPdfMutation = useExportPdf();

	const handleGenerate = useCallback(() => {
		if (!courseId) return;
		const now = new Date();
		generateMutation.mutate(
			{
				courseId,
				month: now.getMonth() + 1,
				year: now.getFullYear(),
			},
			{
				onSuccess: (generated) => {
					toast.success('Reporte generado correctamente');
					setSelectedPeriod({
						month: generated.period.month,
						year: generated.period.year,
					});
					updateUrl(courseId, generated.period);
				},
				onError: () => toast.error('No se pudo generar el reporte'),
			},
		);
	}, [courseId, generateMutation, updateUrl]);

	const handleExport = useCallback(
		async (format: ExportFormat) => {
			if (!courseId || !month || !year) return;
			setPendingExport(format);
			try {
				const payload = { courseId, month, year };
				if (format === 'xlsx') await exportExcelMutation.mutateAsync(payload);
				else await exportPdfMutation.mutateAsync(payload);
				toast.success('Descarga lista');
			} catch (_err) {
				toast.error('No se pudo exportar el reporte. Intentá nuevamente.');
			} finally {
				setPendingExport(null);
			}
		},
		[courseId, month, year, exportExcelMutation, exportPdfMutation],
	);

	return (
		<div className="space-y-6">
			<PageHeader title="Reportes" description="Asistencia mensual por curso" />

			<MonthlyReport
				filters={{
					courseId: selectedCourseId || undefined,
					month,
					year,
				}}
				onCourseChange={handleCourseChange}
				onPeriodChange={handlePeriodChange}
				courses={courses ?? []}
				periods={periods}
				report={report ?? null}
				trendMonths={summary?.months ?? []}
				isLoadingCourses={isLoadingCourses}
				isLoadingPeriods={isLoadingPeriods}
				isLoadingReport={isLoadingReport}
				isLoadingTrend={isLoadingSummary}
				onGenerate={handleGenerate}
				isGenerating={generateMutation.isPending}
				onExport={handleExport}
				pendingExport={pendingExport}
			/>
		</div>
	);
}
