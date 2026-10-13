'use client';

import type { CreateStudentFormValues } from '@repo/common';
import {
	useActiveAcademicYear,
	useCourses,
	useCreateStudent,
} from '@repo/hooks';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	StudentForm,
} from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CreateStudentInterceptedModal() {
	const router = useRouter();
	const [open, setOpen] = useState(true);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [errorField, setErrorField] = useState<keyof CreateStudentFormValues>();
	const { data: activeYear } = useActiveAcademicYear();
	const { data: coursesData } = useCourses({ academicYearId: activeYear?.id });
	const createStudentMutation = useCreateStudent();

	function handleOpenChange(nextOpen: boolean) {
		setOpen(nextOpen);
		if (!nextOpen) {
			router.back();
		}
	}

	const handleSubmit = async (values: CreateStudentFormValues) => {
		setErrorMsg(null);
		setErrorField(undefined);
		try {
			await createStudentMutation.mutateAsync(values);
			toast.success('Estudiante registrado exitosamente');
			handleOpenChange(false);
		} catch (err: unknown) {
			const errorObj = err as {
				response?: { status?: number; data?: { message?: string } };
				status?: number;
				message?: string;
			};
			const statusCode = errorObj?.response?.status || errorObj?.status;
			setErrorField(statusCode === 409 ? 'documentNumber' : undefined);
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
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>Nuevo Estudiante</DialogTitle>
				</DialogHeader>
				<StudentForm
					variant="dialog"
					errorField={errorField}
					onSubmit={handleSubmit}
					isLoading={createStudentMutation.isPending}
					courses={coursesData ?? []}
					onCancel={() => handleOpenChange(false)}
					errorMessage={errorMsg}
				/>
			</DialogContent>
		</Dialog>
	);
}
