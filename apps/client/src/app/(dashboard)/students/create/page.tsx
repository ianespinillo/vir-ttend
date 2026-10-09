'use client';

import type { CreateStudentFormValues } from '@repo/common';
import {
	useActiveAcademicYear,
	useCourses,
	useCreateStudent,
} from '@repo/hooks';
import { PageHeader, StudentForm } from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CreateStudentPage() {
	const router = useRouter();
	const { data: activeYear } = useActiveAcademicYear();
	const { data: coursesData } = useCourses({ academicYearId: activeYear?.id });
	const createStudentMutation = useCreateStudent();
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const handleCancel = () => {
		router.push('/students');
	};

	const handleSubmit = async (values: CreateStudentFormValues) => {
		setErrorMsg(null);
		try {
			const created = await createStudentMutation.mutateAsync(values);
			toast.success('Estudiante registrado exitosamente', {
				action: {
					label: 'Ver alumno',
					onClick: () => router.push(`/students/${created.id}`),
				},
			});
			router.push('/students');
		} catch (err: unknown) {
			const errorObj = err as {
				response?: { status?: number; data?: { message?: string } };
				status?: number;
				message?: string;
			};
			const statusCode = errorObj?.response?.status || errorObj?.status;
			const message =
				statusCode === 409
					? 'El número de documento ya pertenece a un estudiante registrado.'
					: errorObj?.response?.data?.message ||
						errorObj?.message ||
						'Ocurrió un error al crear el estudiante. Intente nuevamente.';
			setErrorMsg(message);
			toast.error(message);
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
