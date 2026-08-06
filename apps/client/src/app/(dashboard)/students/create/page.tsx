'use client';

import type { CreateStudentFormValues } from '@repo/common';
import { useCourses, useCreateStudent } from '@repo/hooks';
import { PageHeader, StudentForm } from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CreateStudentPage() {
	const router = useRouter();
	const { data: coursesData } = useCourses();
	const createStudentMutation = useCreateStudent();
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const handleCancel = () => {
		router.push('/students');
	};

	const handleSubmit = async (values: CreateStudentFormValues) => {
		setErrorMsg(null);
		try {
			await createStudentMutation.mutateAsync(values);
			router.push('/students');
		} catch (err: unknown) {
			const errorObj = err as {
				response?: { status?: number; data?: { message?: string } };
				status?: number;
				message?: string;
			};
			const statusCode = errorObj?.response?.status || errorObj?.status;
			if (statusCode === 409) {
				setErrorMsg(
					'El número de documento ya pertenece a un estudiante registrado.',
				);
			} else {
				setErrorMsg(
					errorObj?.response?.data?.message ||
						errorObj?.message ||
						'Ocurrió un error al crear el estudiante. Intente nuevamente.',
				);
			}
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
				isLoading={createStudentMutation.isPending}
				courses={coursesData || []}
				onCancel={handleCancel}
				errorMessage={errorMsg}
			/>
		</div>
	);
}
