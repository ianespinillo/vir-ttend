'use client';

/**
 * Demo `/attendance/student/[id]` — the student history page.
 *
 * Mirrors `apps/client/src/app/(dashboard)/attendance/student/[id]/page.tsx`:
 * weighted metrics, monthly bars, student vs course comparison chart,
 * per-subject breakdown, alerts and the attendance history list. Everything is
 * derived from the demo store; exporting is simulated (toast).
 */

import { useDemo } from '@/lib/session/demo-provider';
import { STUDENT_ROUTES } from '@repo/common';
import type { ExportFormat } from '@repo/common';
import { ErrorState, StudentHistoryPage } from '@repo/ui';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export default function StudentHistoryScreenPage() {
	const params = useParams();
	const router = useRouter();
	const { state, selectors } = useDemo();
	const [pendingExport, setPendingExport] = useState<ExportFormat | null>(null);

	const studentId = Array.isArray(params.id)
		? (params.id[0] ?? '')
		: (params.id ?? '');
	const student = selectors.getStudentById(state, studentId);
	const activeYear = selectors
		.getAcademicYears(state)
		.find((year) => year.isActive);

	const handleBack = useCallback(() => {
		router.push(STUDENT_ROUTES.student(studentId));
	}, [router, studentId]);

	const handleExport = useCallback((format: ExportFormat) => {
		setPendingExport(format);
		setTimeout(() => {
			setPendingExport(null);
			toast.success(`Legajo exportado correctamente (${format.toUpperCase()})`);
		}, 400);
	}, []);

	if (!student) {
		return (
			<ErrorState
				title="Error al cargar el alumno"
				description="No se encontró la información del alumno."
				onRetry={() => router.push(STUDENT_ROUTES.students)}
			/>
		);
	}

	return (
		<StudentHistoryPage
			student={student}
			academicYearLabel={activeYear ? String(activeYear.year) : ''}
			report={selectors.getStudentReport(state, studentId)}
			summary={selectors.getCourseSummaryResponse(state, student.courseId)}
			alerts={selectors.getStudentAlerts(state, studentId)}
			history={selectors.getStudentAttendanceHistory(state, studentId)}
			subjects={selectors.getSubjects(state, student.courseId)}
			onBack={handleBack}
			onExport={handleExport}
			pendingExport={pendingExport}
			exportDisabled={!activeYear}
		/>
	);
}
