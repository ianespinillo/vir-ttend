'use client';

import type { CreateCourseFormValues } from '@repo/common';
import { useAcademicYears, useCreateCourse, useUsersByRole } from '@repo/hooks';
import { CourseForm, PageHeader } from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CreateCoursePage() {
	const router = useRouter();
	const { data: academicYears } = useAcademicYears();
	const { data: preceptors } = useUsersByRole('preceptor');
	const createCourseMutation = useCreateCourse();
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const handleCancel = () => {
		router.push('/courses');
	};

	const handleSubmit = async (values: CreateCourseFormValues) => {
		setErrorMsg(null);
		try {
			await createCourseMutation.mutateAsync(values);
			router.push('/courses');
		} catch (err: unknown) {
			const errorObj = err as {
				response?: { data?: { message?: string } };
				message?: string;
			};
			setErrorMsg(
				errorObj?.response?.data?.message ||
					errorObj?.message ||
					'Ocurrió un error al crear el curso. Verifique los datos.',
			);
		}
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title="Nuevo Curso"
				description="Registre una nueva división o curso para el ciclo lectivo"
			/>

			{errorMsg && (
				<div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm font-medium">
					{errorMsg}
				</div>
			)}

			<CourseForm
				onSubmit={handleSubmit}
				isLoading={createCourseMutation.isPending}
				academicYears={academicYears || []}
				preceptors={preceptors || []}
				onCancel={handleCancel}
			/>
		</div>
	);
}
