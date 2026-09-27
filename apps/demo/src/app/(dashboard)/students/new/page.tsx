'use client';

/**
 * Demo `/students/new` — the product create form, fed by the demo store.
 *
 * Mirrors `apps/client/src/app/(dashboard)/students/create/page.tsx`: same
 * `PageHeader` + `StudentForm` composition, same submit-then-go-back-to-list
 * flow and same error banner. The only change is the mutation: instead of
 * `useCreateStudent`, the form values go straight to `store.createStudent`
 * (the store persists and notifies on its own, so there is no pending state
 * to mirror — `isLoading` is always false).
 */

import { useDemo } from '@/lib/session/demo-provider';
import type { CreateStudentFormValues } from '@repo/common';
import { STUDENT_ROUTES } from '@repo/common';
import { PageHeader, StudentForm } from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const CREATE_ERROR_FALLBACK =
	'Ocurrió un error al crear el estudiante. Intente nuevamente.';

export default function NewStudentPage() {
	const router = useRouter();
	const { state, selectors, store } = useDemo();
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const handleCancel = () => {
		router.push(STUDENT_ROUTES.students);
	};

	const handleSubmit = (values: CreateStudentFormValues) => {
		setErrorMsg(null);
		try {
			store.createStudent(values);
			router.push(STUDENT_ROUTES.students);
		} catch (err: unknown) {
			setErrorMsg(err instanceof Error ? err.message : CREATE_ERROR_FALLBACK);
		}
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title="Nuevo Estudiante"
				description="Registre un nuevo estudiante en la institución"
			/>

			<StudentForm
				onSubmit={handleSubmit}
				isLoading={false}
				courses={selectors.getCourses(state)}
				onCancel={handleCancel}
				errorMessage={errorMsg}
			/>
		</div>
	);
}
