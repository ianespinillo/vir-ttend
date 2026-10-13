'use client';

import type { CreateStudentFormValues } from '@repo/common';
import {
	useActiveAcademicYear,
	useCourses,
	useDeleteStudent,
	useEnrollStudent,
	useStudent,
	useStudentReport,
	useTransferStudent,
	useUpdateStudent,
} from '@repo/hooks';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	EnrollmentModal,
	ErrorState,
	LoadingSpinner,
	StudentDetail,
	StudentForm,
	StudentReport,
} from '@repo/ui';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../../../lib/auth/provider';

export default function StudentDetailPage() {
	const params = useParams();
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user } = useAuth();

	const studentId = Array.isArray(params.id) ? params.id[0] : params.id || '';
	const isEditQuery = searchParams.get('edit') === 'true';
	const [isEditing, setIsEditing] = useState(isEditQuery);

	const role = user?.role?.toLowerCase();
	const isAdmin = role === 'admin' || role === 'superadmin';
	const isPreceptor = role === 'preceptor';

	const { data: student, isLoading, isError, error } = useStudent(studentId);
	const { data: activeYear } = useActiveAcademicYear();
	const { data: coursesData } = useCourses({ academicYearId: activeYear?.id });
	const courses = coursesData ?? [];

	const { data: report, isLoading: isLoadingReport } = useStudentReport({
		studentId,
		academicYearId: activeYear?.id,
	});

	const updateMutation = useUpdateStudent();
	const enrollMutation = useEnrollStudent();
	const transferMutation = useTransferStudent();
	const deleteMutation = useDeleteStudent();

	const [modalState, setModalState] = useState<{
		open: boolean;
		mode: 'enroll' | 'change';
	}>({ open: false, mode: 'enroll' });

	const [formError, setFormError] = useState<string | null>(null);
	const [errorField, setErrorField] = useState<keyof CreateStudentFormValues>();

	const handleBack = () => {
		router.push('/students');
	};

	const handleUpdateSubmit = async (values: CreateStudentFormValues) => {
		setFormError(null);
		setErrorField(undefined);
		try {
			await updateMutation.mutateAsync({
				id: studentId,
				data: values,
			});
			toast.success('Estudiante actualizado exitosamente');
			setIsEditing(false);
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
					? 'El número de documento ingresado ya pertenece a otro estudiante.'
					: errorObj?.response?.data?.message ||
						errorObj?.message ||
						'Ocurrió un error al actualizar los datos del estudiante.';
			setFormError(message);
			toast.error(message);
		}
	};

	const handleModalSubmit = async (targetCourseId: string) => {
		const isEnroll = modalState.mode === 'enroll';
		try {
			await enrollMutation.mutateAsync({
				id: studentId,
				data: { courseId: targetCourseId },
			});
			toast.success(
				isEnroll
					? 'Estudiante matriculado exitosamente'
					: 'Curso cambiado exitosamente',
			);
		} catch (err: unknown) {
			const errorObj = err as {
				response?: { data?: { message?: string } };
				message?: string;
			};
			toast.error(
				errorObj?.response?.data?.message ||
					errorObj?.message ||
					(isEnroll
						? 'Error al matricular el estudiante'
						: 'Error al cambiar el curso del estudiante'),
			);
		}
	};

	const handleTransfer = async () => {
		if (!student) return;
		if (
			!window.confirm(
				`¿Confirma el traslado de ${student.fullName} a otra escuela? El alumno quedará marcado como Transferido.`,
			)
		) {
			return;
		}
		try {
			await transferMutation.mutateAsync({ id: studentId });
			toast.success('Estudiante trasladado a otra escuela');
		} catch (err: unknown) {
			const errorObj = err as {
				response?: { data?: { message?: string } };
				message?: string;
			};
			toast.error(
				errorObj?.response?.data?.message ||
					errorObj?.message ||
					'Error al trasladar el estudiante',
			);
		}
	};

	const handleDeactivate = async () => {
		if (
			student &&
			window.confirm(`¿Está seguro de que desea desactivar a ${student.fullName}?`)
		) {
			try {
				await deleteMutation.mutateAsync(studentId);
				toast.success('Estudiante desactivado exitosamente');
			} catch (err: unknown) {
				const errorObj = err as {
					response?: { data?: { message?: string } };
					message?: string;
				};
				toast.error(
					errorObj?.response?.data?.message ||
						errorObj?.message ||
						'Error al desactivar el estudiante',
				);
			}
		}
	};

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
				title="Error al cargar estudiante"
				description={
					(error as Error)?.message ||
					'No se encontró la información del estudiante.'
				}
				onRetry={handleBack}
			/>
		);
	}

	const formattedBirthDate = student.birthDate
		? String(student.birthDate).split('T')[0]
		: '';

	return (
		<div className="space-y-6">
			<StudentDetail
				student={student}
				courses={courses}
				onBack={handleBack}
				onEdit={() => setIsEditing(true)}
				onEnroll={() => setModalState({ open: true, mode: 'enroll' })}
				onChangeCourse={() => setModalState({ open: true, mode: 'change' })}
				onTransfer={handleTransfer}
				onDeactivate={handleDeactivate}
				isAdmin={isAdmin}
				isPreceptor={isPreceptor}
				attendancePath={`/attendance/student/${student.id}`}
				reportTab={
					<StudentReport report={report ?? null} isLoading={isLoadingReport} />
				}
			/>

			{/* Modal Editar estudiante */}
			<Dialog
				open={isEditing}
				onOpenChange={(open) => !open && setIsEditing(false)}
			>
				<DialogContent className="sm:max-w-3xl">
					<DialogHeader>
						<DialogTitle>{`Editar: ${student.lastName}, ${student.firstName}`}</DialogTitle>
					</DialogHeader>
					<StudentForm
						isEditing
						variant="dialog"
						errorField={errorField}
						defaultValues={{
							firstName: student.firstName,
							lastName: student.lastName,
							documentNumber: student.documentNumber,
							birthDate: formattedBirthDate,
							courseId: student.courseId,
							tutorName: student.tutorName,
							tutorPhone: student.tutorPhone,
							tutorEmail: student.tutorEmail || '',
						}}
						onSubmit={handleUpdateSubmit}
						isLoading={updateMutation.isPending}
						courses={courses}
						onCancel={() => setIsEditing(false)}
						errorMessage={formError}
					/>
				</DialogContent>
			</Dialog>

			<EnrollmentModal
				open={modalState.open}
				onOpenChange={(open) => setModalState((prev) => ({ ...prev, open }))}
				studentName={student.fullName}
				currentCourseId={student.courseId}
				mode={modalState.mode}
				courses={courses}
				onSubmit={handleModalSubmit}
				isLoading={enrollMutation.isPending}
			/>
		</div>
	);
}
