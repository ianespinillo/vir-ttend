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
	EnrollmentModal,
	ErrorState,
	LoadingSpinner,
	PageHeader,
	StudentDetail,
	StudentForm,
	StudentReport,
} from '@repo/ui';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
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
	const { data: coursesData } = useCourses();
	const courses = coursesData || [];

	const { data: activeYear } = useActiveAcademicYear();
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
		mode: 'enroll' | 'transfer';
	}>({ open: false, mode: 'enroll' });

	const [formError, setFormError] = useState<string | null>(null);

	const handleBack = () => {
		router.push('/students');
	};

	const handleUpdateSubmit = async (values: CreateStudentFormValues) => {
		setFormError(null);
		try {
			await updateMutation.mutateAsync({
				id: studentId,
				data: values,
			});
			setIsEditing(false);
			router.replace(`/students/${studentId}`);
		} catch (err: unknown) {
			const errorObj = err as {
				response?: { status?: number; data?: { message?: string } };
				status?: number;
				message?: string;
			};
			const statusCode = errorObj?.response?.status || errorObj?.status;
			if (statusCode === 409) {
				setFormError(
					'El número de documento ingresado ya pertenece a otro estudiante.',
				);
			} else {
				setFormError(
					errorObj?.response?.data?.message ||
						errorObj?.message ||
						'Ocurrió un error al actualizar los datos del estudiante.',
				);
			}
		}
	};

	const handleModalSubmit = async (targetCourseId: string) => {
		if (modalState.mode === 'enroll') {
			await enrollMutation.mutateAsync({
				id: studentId,
				data: { courseId: targetCourseId },
			});
		} else {
			await transferMutation.mutateAsync({
				id: studentId,
				data: { targetCourseId },
			});
		}
	};

	const handleDeactivate = async () => {
		if (
			student &&
			window.confirm(`¿Está seguro de que desea desactivar a ${student.fullName}?`)
		) {
			await deleteMutation.mutateAsync(studentId);
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

	if (isEditing) {
		const formattedBirthDate = student.birthDate
			? String(student.birthDate).split('T')[0]
			: '';

		return (
			<div className="space-y-6">
				<PageHeader
					title={`Editar: ${student.lastName}, ${student.firstName}`}
					description="Modifique los datos personales o la información del tutor"
				/>

				<StudentForm
					isEditing
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
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<StudentDetail
				student={student}
				courses={courses}
				onBack={handleBack}
				onEdit={() => setIsEditing(true)}
				onEnroll={() => setModalState({ open: true, mode: 'enroll' })}
				onTransfer={() => setModalState({ open: true, mode: 'transfer' })}
				onDeactivate={handleDeactivate}
				isAdmin={isAdmin}
				isPreceptor={isPreceptor}
				attendancePath={`/attendance/student/${student.id}`}
				reportTab={
					<StudentReport report={report ?? null} isLoading={isLoadingReport} />
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
				isLoading={enrollMutation.isPending || transferMutation.isPending}
			/>
		</div>
	);
}
