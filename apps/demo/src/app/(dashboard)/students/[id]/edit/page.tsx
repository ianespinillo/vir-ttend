'use client';

/**
 * Demo `/students/[id]/edit` — the product edit form, fed by the demo store.
 *
 * Same composition as the product's inline edit branch
 * (`apps/client/src/app/(dashboard)/students/[id]/page.tsx`): a `PageHeader`
 * with `Editar: {lastName}, {firstName}` and the `StudentForm` in editing mode
 * seeded from the student. Submitting dispatches `store.updateStudent` and goes
 * back to the detail page; the form's course field is accepted but not
 * persisted, because the product changes a course through enroll/transfer
 * (see `toUpdateStudentInput`).
 */

import { useDemo } from '@/lib/session/demo-provider';
import {
	toStudentFormDefaults,
	toUpdateStudentInput,
} from '@/lib/students/student-mappings';
import type { CreateStudentFormValues } from '@repo/common';
import { STUDENT_ROUTES } from '@repo/common';
import { ErrorState, PageHeader, StudentForm } from '@repo/ui';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

const UPDATE_ERROR_FALLBACK =
	'Ocurrió un error al actualizar los datos del estudiante.';

export default function EditStudentPage() {
	const params = useParams();
	const router = useRouter();
	const { state, selectors, store } = useDemo();
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const studentId = Array.isArray(params.id)
		? (params.id[0] ?? '')
		: (params.id ?? '');

	const student = selectors.getStudentById(state, studentId);
	const courses = selectors.getCourses(state);

	const handleCancel = () => {
		router.push(STUDENT_ROUTES.student(studentId));
	};

	if (!student) {
		return (
			<ErrorState
				title="Error al cargar estudiante"
				description="No se encontró la información del estudiante."
				onRetry={() => router.push(STUDENT_ROUTES.students)}
			/>
		);
	}

	const handleSubmit = (values: CreateStudentFormValues) => {
		setErrorMsg(null);
		try {
			store.updateStudent(studentId, toUpdateStudentInput(values));
			router.push(STUDENT_ROUTES.student(studentId));
		} catch (err: unknown) {
			setErrorMsg(err instanceof Error ? err.message : UPDATE_ERROR_FALLBACK);
		}
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title={`Editar: ${student.lastName}, ${student.firstName}`}
				description="Modifique los datos personales o la información del tutor"
			/>

			<StudentForm
				isEditing
				defaultValues={toStudentFormDefaults(student)}
				onSubmit={handleSubmit}
				isLoading={false}
				courses={courses}
				onCancel={handleCancel}
				errorMessage={errorMsg}
			/>
		</div>
	);
}
