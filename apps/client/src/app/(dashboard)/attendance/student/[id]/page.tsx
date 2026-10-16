'use client';

import type { ExportFormat } from '@repo/common';
import {
	useActiveAcademicYear,
	useAlertsByStudent,
	useAttendanceHistory,
	useCourseSummary,
	useExportExcel,
	useExportPdf,
	useStudent,
	useStudentReport,
	useSubjects,
} from '@repo/hooks';
import { ErrorState, LoadingSpinner, StudentHistoryPage } from '@repo/ui';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

/** Format a date as `YYYY-MM-DD` using local parts (avoids UTC day shifts). */
function toDateInput(date: Date | string): string {
	const value = new Date(date);
	const year = value.getFullYear();
	const month = String(value.getMonth() + 1).padStart(2, '0');
	const day = String(value.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export default function StudentHistoryScreenPage() {
	const params = useParams();
	const router = useRouter();

	const studentId = Array.isArray(params.id) ? params.id[0] : params.id || '';

	const { data: student, isLoading, isError, error } = useStudent(studentId);
	const { data: activeYear } = useActiveAcademicYear();

	const courseId = student?.courseId;
	const academicYearId = activeYear?.id;

	const { data: report, isLoading: isLoadingReport } = useStudentReport({
		studentId,
		academicYearId,
	});
	const { data: summary, isLoading: isLoadingSummary } = useCourseSummary({
		courseId,
		academicYearId,
	});
	const { data: alertsData, isLoading: isLoadingAlerts } = useAlertsByStudent({
		studentId,
		academicYearId,
	});
	const { data: subjects } = useSubjects(courseId);

	const from = activeYear ? toDateInput(activeYear.startDate) : '';
	const to = activeYear ? toDateInput(activeYear.endDate) : '';
	const { data: history, isLoading: isLoadingHistory } = useAttendanceHistory({
		studentId,
		from,
		to,
	});

	const [pendingExport, setPendingExport] = useState<ExportFormat | null>(null);
	const exportExcelMutation = useExportExcel();
	const exportPdfMutation = useExportPdf();

	const handleBack = useCallback(() => {
		router.push(`/students/${studentId}`);
	}, [router, studentId]);

	const handleExport = useCallback(
		async (format: ExportFormat) => {
			if (!student || !activeYear) return;
			const month = new Date(activeYear.startDate).getMonth() + 1;
			setPendingExport(format);
			try {
				const payload = {
					courseId: student.courseId,
					month,
					year: activeYear.year,
					type: 'student' as const,
					studentId,
				};
				if (format === 'xlsx') await exportExcelMutation.mutateAsync(payload);
				else await exportPdfMutation.mutateAsync(payload);
				toast.success('Descarga lista');
			} catch (_err) {
				toast.error('No se pudo exportar el legajo. Intentá nuevamente.');
			} finally {
				setPendingExport(null);
			}
		},
		[student, activeYear, studentId, exportExcelMutation, exportPdfMutation],
	);

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<LoadingSpinner />
			</div>
		);
	}

	if (isError || !student) {
		return (
			<ErrorState
				title="Error al cargar el alumno"
				description={
					(error as Error)?.message || 'No se encontró la información del alumno.'
				}
				onRetry={handleBack}
			/>
		);
	}

	return (
		<StudentHistoryPage
			student={student}
			academicYearLabel={activeYear ? String(activeYear.year) : ''}
			report={report ?? null}
			isLoadingReport={isLoadingReport}
			summary={summary ?? null}
			isLoadingSummary={isLoadingSummary}
			alerts={alertsData?.items ?? []}
			isLoadingAlerts={isLoadingAlerts}
			history={history ?? []}
			isLoadingHistory={isLoadingHistory}
			subjects={subjects ?? []}
			onBack={handleBack}
			onExport={handleExport}
			pendingExport={pendingExport}
			exportDisabled={!activeYear}
		/>
	);
}
