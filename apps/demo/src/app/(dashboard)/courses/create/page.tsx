'use client';

import {
	toCreateCourseInput,
	toUserResponse,
} from '@/lib/academic/academic-mappings';
import { useDemo } from '@/lib/session/demo-provider';
import {
	ACADEMIC_ROUTES,
	type CreateCourseFormValues,
	ROLES,
} from '@repo/common';
import { CourseForm, PageHeader } from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const CREATE_ERROR_FALLBACK =
	'Ocurrió un error al crear el curso. Intente nuevamente.';

export default function NewCoursePage() {
	const router = useRouter();
	const { state, selectors, store } = useDemo();
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const handleCancel = () => {
		router.push(ACADEMIC_ROUTES.courses);
	};

	const handleSubmit = (values: CreateCourseFormValues) => {
		setErrorMsg(null);
		try {
			const course = store.createCourse(toCreateCourseInput(values));
			router.push(ACADEMIC_ROUTES.course(course.id));
		} catch (error: unknown) {
			setErrorMsg(error instanceof Error ? error.message : CREATE_ERROR_FALLBACK);
		}
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title="Nuevo Curso"
				description="Registre un nuevo curso y asigne su preceptor"
			/>
			{errorMsg && (
				<div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
					{errorMsg}
				</div>
			)}
			<CourseForm
				onSubmit={handleSubmit}
				isLoading={false}
				academicYears={selectors.getAcademicYears(state)}
				preceptors={selectors
					.getUsers(state, { role: ROLES.PRECEPTOR, limit: 100 })
					.items.map(toUserResponse)}
				onCancel={handleCancel}
			/>
		</div>
	);
}
