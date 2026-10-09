'use client';

/**
 * Demo `/students/[id]` — the product student detail, fed by the demo store.
 *
 * Mirrors `apps/client/src/app/(dashboard)/students/[id]/page.tsx`: same
 * `StudentDetail` panel (profile card, personal/tutor tabs, attendance link,
 * report tab) plus the `EnrollmentModal` for enroll/transfer, and the same
 * role-gated action buttons. Reads become `getStudentById`, `getCourses` and
 * `getStudentReport`; mutations become `store.transferStudent` /
 * `store.enrollStudent` / `store.toggleStudentStatus`.
 *
 * Two deliberate differences from the product:
 * - Editing is a route (`/students/[id]/edit`) instead of the product's inline
 *   `?edit=true` toggle, so the demo has a real form URL to show a prospect.
 * - There is no loading branch: the store reads are synchronous, so the page
 *   renders the student (or the product `ErrorState`) on the first paint.
 */

import { useDemo } from '@/lib/session/demo-provider';
import { DEMO_STUDENT_ROUTES } from '@/lib/students/student-mappings';
import { ATTENDANCE_ROUTES, ROLES, STUDENT_ROUTES } from '@repo/common';
import {
	EnrollmentModal,
	ErrorState,
	StudentDetail,
	StudentReport,
} from '@repo/ui';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function StudentDetailPage() {
	const params = useParams();
	const router = useRouter();
	const { state, session, selectors, store } = useDemo();

	const studentId = Array.isArray(params.id)
		? (params.id[0] ?? '')
		: (params.id ?? '');

	const [modalState, setModalState] = useState<{
		open: boolean;
		mode: 'enroll' | 'change';
	}>({ open: false, mode: 'enroll' });

	const user = session.user;
	const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPERADMIN;
	const isPreceptor = user?.role === ROLES.PRECEPTOR;

	const student = selectors.getStudentById(state, studentId);
	const courses = selectors.getCourses(state);

	const handleBack = () => {
		router.push(STUDENT_ROUTES.students);
	};

	if (!student) {
		return (
			<ErrorState
				title="Error al cargar estudiante"
				description="No se encontró la información del estudiante."
				onRetry={handleBack}
			/>
		);
	}

	const handleModalSubmit = (targetCourseId: string) => {
		// Both 'enroll' and 'change' assign a course and keep the student active.
		store.enrollStudent(student.id, targetCourseId);
	};

	const handleTransfer = () => {
		if (
			window.confirm(
				`¿Confirma el traslado de ${student.fullName} a otra escuela? El alumno quedará marcado como Transferido.`,
			)
		) {
			store.transferStudent(student.id, student.courseId);
		}
	};

	const handleDeactivate = () => {
		if (
			window.confirm(`¿Está seguro de que desea desactivar a ${student.fullName}?`)
		) {
			store.toggleStudentStatus(student.id, false);
		}
	};

	return (
		<div className="space-y-6">
			<StudentDetail
				student={student}
				courses={courses}
				onBack={handleBack}
				onEdit={() => router.push(DEMO_STUDENT_ROUTES.edit(student.id))}
				onEnroll={() => setModalState({ open: true, mode: 'enroll' })}
				onChangeCourse={() => setModalState({ open: true, mode: 'change' })}
				onTransfer={handleTransfer}
				onDeactivate={handleDeactivate}
				isAdmin={isAdmin}
				isPreceptor={isPreceptor}
				attendancePath={ATTENDANCE_ROUTES.byStudent(student.id)}
				reportTab={
					<StudentReport
						report={selectors.getStudentReport(state, student.id)}
						isLoading={false}
					/>
				}
			/>

			<EnrollmentModal
				open={modalState.open}
				onOpenChange={(open) => setModalState((prev) => ({ ...prev, open }))}
				studentName={student.fullName}
				currentCourseId={student.courseId}
				mode={modalState.mode}
				courses={courses}
				onSubmit={handleModalSubmit}
				isLoading={false}
			/>
		</div>
	);
}
