'use client';

import { StudentImportContainer } from '@/components/students/student-import-container';
import { useAuth } from '@/lib/auth/provider';
import {
	type CreateCourseFormValues,
	type CreateSubjectFormValues,
	type ISubjectResponse,
	ROLES,
	STUDENTSTATUS,
	type ScheduleSlotFormValues,
} from '@repo/common';
import {
	useAcademicYears,
	useAssignWorkshopPreceptor,
	useCourse,
	useCreateSubject,
	useCreateWorkshopCommissions,
	useDeleteCourse,
	useDeleteSubject,
	useMoveStudentToCommission,
	useRegenerateWorkshopCommissions,
	useSchedule,
	useSetCourseStatus,
	useSetSchedule,
	useStudents,
	useSubjects,
	useUpdateCourse,
	useUpdateSubject,
	useUsersByRole,
	useWorkshopCommissions,
} from '@repo/hooks';
import {
	CourseDetail,
	CourseForm,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	ErrorState,
	LoadingSpinner,
	PageHeader,
	SubjectForm,
	WorkshopCommissionsPanel,
	localizeCourseName,
} from '@repo/ui';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CourseDetailPage() {
	const params = useParams();
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user } = useAuth();

	const courseId = Array.isArray(params.id) ? params.id[0] : params.id || '';
	const isEditQuery = searchParams.get('edit') === 'true';
	const [isEditingCourse, setIsEditingCourse] = useState(isEditQuery);

	const role = user?.role?.toLowerCase();
	const isAdmin = role === ROLES.ADMIN || role === ROLES.SUPERADMIN;
	const isPreceptor = role === ROLES.PRECEPTOR;
	const canManageSchedule = isAdmin || isPreceptor;
	const canManageSubjects = isAdmin || isPreceptor;
	const [isImportOpen, setIsImportOpen] = useState(false);

	const { data: course, isLoading, isError, error } = useCourse(courseId);
	const { data: subjectsData } = useSubjects(courseId);
	const { data: scheduleData } = useSchedule(courseId);
	const { data: studentsData, isLoading: studentsLoading } = useStudents({
		courseId,
		status: STUDENTSTATUS.ACTIVE,
		limit: 100,
	});
	const { data: academicYears } = useAcademicYears();
	// Admins edit the course; the course preceptor picks commission preceptors.
	// Both need the tenant's preceptors.
	const { data: preceptors } = useUsersByRole(
		isAdmin || (isPreceptor && course?.preceptorId === user?.id)
			? ROLES.PRECEPTOR
			: undefined,
	);
	const { data: teachers } = useUsersByRole(ROLES.TEACHER);
	// Also read by schedule editors: the slot form hides the commission selector
	// when the course has a single commission (or none).
	const { data: commissions, isLoading: commissionsLoading } =
		useWorkshopCommissions(courseId, canManageSchedule);

	const updateCourseMutation = useUpdateCourse();
	const deleteCourseMutation = useDeleteCourse();
	const setCourseStatusMutation = useSetCourseStatus();
	const createSubjectMutation = useCreateSubject();
	const updateSubjectMutation = useUpdateSubject();
	const deleteSubjectMutation = useDeleteSubject();
	const setScheduleMutation = useSetSchedule();
	const createCommissionsMutation = useCreateWorkshopCommissions();
	const regenerateCommissionsMutation = useRegenerateWorkshopCommissions();
	const assignPreceptorMutation = useAssignWorkshopPreceptor();
	const moveStudentMutation = useMoveStudentToCommission();

	const [subjectModalState, setSubjectModalState] = useState<{
		open: boolean;
		subject: ISubjectResponse | null;
	}>({ open: false, subject: null });

	const handleBack = () => {
		router.push('/courses');
	};

	const handleUpdateCourse = async (values: CreateCourseFormValues) => {
		try {
			await updateCourseMutation.mutateAsync({
				id: courseId,
				data: values,
			});
			toast.success('Curso actualizado exitosamente');
			setIsEditingCourse(false);
			router.replace(`/courses/${courseId}`);
		} catch (err: unknown) {
			const errorObj = err as {
				response?: { data?: { message?: string } };
				message?: string;
			};
			toast.error(
				errorObj?.response?.data?.message ||
					errorObj?.message ||
					'Error al actualizar el curso',
			);
		}
	};

	const handleDeleteCourse = async () => {
		if (
			course &&
			window.confirm(
				`¿Está seguro de que desea eliminar el curso ${localizeCourseName(course.fullName)}?`,
			)
		) {
			try {
				await deleteCourseMutation.mutateAsync(courseId);
				toast.success('Curso eliminado exitosamente');
				router.push('/courses');
			} catch (err: unknown) {
				const errorObj = err as {
					response?: { data?: { message?: string } };
					message?: string;
				};
				toast.error(
					errorObj?.response?.data?.message ||
						errorObj?.message ||
						'Error al eliminar el curso',
				);
			}
		}
	};

	const handleToggleCourseActive = async (isActive: boolean) => {
		if (
			!isActive &&
			!window.confirm(
				'¿Desactivar este curso? Podés volver a activarlo cuando quieras.',
			)
		) {
			return;
		}
		try {
			await setCourseStatusMutation.mutateAsync({ courseId, isActive });
			toast.success(isActive ? 'Curso activado' : 'Curso desactivado');
		} catch (err: unknown) {
			const errorObj = err as {
				response?: { data?: { message?: string } };
				message?: string;
			};
			toast.error(
				errorObj?.response?.data?.message ||
					errorObj?.message ||
					(isActive ? 'Error al activar el curso' : 'Error al desactivar el curso'),
			);
		}
	};

	const handleSaveSubject = async (values: CreateSubjectFormValues) => {
		const isEditing = Boolean(subjectModalState.subject);
		try {
			if (subjectModalState.subject) {
				await updateSubjectMutation.mutateAsync({
					id: subjectModalState.subject.id,
					courseId,
					data: values,
				});
			} else {
				await createSubjectMutation.mutateAsync({
					...values,
					courseId,
				});
			}
			toast.success(
				isEditing
					? 'Materia actualizada exitosamente'
					: 'Materia agregada exitosamente',
			);
			setSubjectModalState({ open: false, subject: null });
		} catch (err: unknown) {
			const errorObj = err as {
				response?: { data?: { message?: string } };
				message?: string;
			};
			toast.error(
				errorObj?.response?.data?.message ||
					errorObj?.message ||
					'Error al guardar la materia',
			);
		}
	};

	const handleDeleteSubject = async (subject: ISubjectResponse) => {
		if (
			window.confirm(
				`¿Está seguro de que desea eliminar la materia ${subject.name}?`,
			)
		) {
			try {
				await deleteSubjectMutation.mutateAsync({
					id: subject.id,
					courseId,
				});
				toast.success('Materia eliminada exitosamente');
			} catch (err: unknown) {
				const errorObj = err as {
					response?: { data?: { message?: string } };
					message?: string;
				};
				toast.error(
					errorObj?.response?.data?.message ||
						errorObj?.message ||
						'Error al eliminar la materia',
				);
			}
		}
	};

	const handleSaveSchedule = async (slots: ScheduleSlotFormValues[]) => {
		try {
			await setScheduleMutation.mutateAsync({
				courseId,
				slots,
			});
			toast.success('Horarios guardados exitosamente');
		} catch (err: unknown) {
			const errorObj = err as {
				response?: { data?: { message?: string } };
				message?: string;
			};
			toast.error(
				errorObj?.response?.data?.message ||
					errorObj?.message ||
					'Error al guardar los horarios',
			);
		}
	};

	const runCommissionAction = async (
		action: () => Promise<unknown>,
		successMessage: string,
		fallbackError: string,
	) => {
		try {
			await action();
			toast.success(successMessage);
		} catch (err: unknown) {
			const errorObj = err as {
				response?: { data?: { message?: string } };
				message?: string;
			};
			toast.error(
				errorObj?.response?.data?.message || errorObj?.message || fallbackError,
			);
		}
	};

	const commissionsBusy =
		createCommissionsMutation.isPending ||
		regenerateCommissionsMutation.isPending ||
		assignPreceptorMutation.isPending ||
		moveStudentMutation.isPending;

	const isCoursePreceptor =
		isPreceptor && Boolean(user?.id) && course?.preceptorId === user?.id;
	const canImportStudents = isAdmin || isCoursePreceptor;
	// The course preceptor reorganizes commissions and assigns their preceptors.
	const canManageCommissions = isAdmin || isCoursePreceptor;

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<LoadingSpinner />
			</div>
		);
	}

	if (isError || !course) {
		return (
			<ErrorState
				title="Error al cargar el curso"
				description={
					(error as Error)?.message || 'No se encontró la información del curso.'
				}
				onRetry={handleBack}
			/>
		);
	}

	if (isEditingCourse) {
		return (
			<div className="space-y-6">
				<PageHeader
					title={`Editar: ${localizeCourseName(course.fullName)}`}
					description="Modifique la información del curso o la asignación de preceptor"
				/>

				<CourseForm
					isEditing
					defaultValues={{
						academicYearId: course.academicYearId || '',
						level: course.level,
						yearNumber: course.yearNumber,
						division: course.division,
						shift: course.shift,
						preceptorId: course.preceptorId || '',
					}}
					onSubmit={handleUpdateCourse}
					isLoading={updateCourseMutation.isPending}
					academicYears={academicYears || []}
					preceptors={preceptors?.items || []}
					onCancel={() => setIsEditingCourse(false)}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<CourseDetail
				course={course}
				subjects={subjectsData || course.subjects || []}
				schedule={scheduleData || course.schedule || []}
				onBack={handleBack}
				onEdit={() => setIsEditingCourse(true)}
				onDelete={handleDeleteCourse}
				onToggleActive={isAdmin ? handleToggleCourseActive : undefined}
				isTogglingActive={setCourseStatusMutation.isPending}
				onAddSubject={() => setSubjectModalState({ open: true, subject: null })}
				onEditSubject={(subject) => setSubjectModalState({ open: true, subject })}
				onDeleteSubject={isAdmin ? handleDeleteSubject : undefined}
				onSaveSchedule={handleSaveSchedule}
				onImportStudents={
					canImportStudents ? () => setIsImportOpen(true) : undefined
				}
				canManage={isAdmin}
				canManageSchedule={canManageSchedule}
				canManageSubjects={canManageSubjects}
				students={studentsData?.items ?? []}
				isLoadingStudents={studentsLoading}
				studentCount={studentsData?.total}
				onViewStudent={(id) => router.push(`/students/${id}`)}
				attendancePath={`/attendance?courseId=${course.id}`}
				commissionNumbers={commissions?.map((c) => c.number)}
				commissionsTab={
					canManageCommissions ? (
						<WorkshopCommissionsPanel
							commissions={commissions ?? []}
							preceptors={preceptors?.items || []}
							isLoading={commissionsLoading}
							isBusy={commissionsBusy}
							onCreate={(count) =>
								runCommissionAction(
									() => createCommissionsMutation.mutateAsync({ courseId, count }),
									'Comisiones creadas exitosamente',
									'Error al crear las comisiones',
								)
							}
							onAssignPreceptor={
								canManageCommissions
									? (commissionId, preceptorId) =>
											runCommissionAction(
												() =>
													assignPreceptorMutation.mutateAsync({
														courseId,
														commissionId,
														preceptorId,
													}),
												'Preceptor de la comisión actualizado',
												'Error al asignar el preceptor',
											)
									: undefined
							}
							onMoveStudent={(commissionId, studentId) =>
								runCommissionAction(
									() =>
										moveStudentMutation.mutateAsync({
											courseId,
											commissionId,
											studentId,
										}),
									'Estudiante movido de comisión',
									'Error al mover al estudiante',
								)
							}
							onRegenerate={() =>
								runCommissionAction(
									() => regenerateCommissionsMutation.mutateAsync(courseId),
									'Reparto regenerado exitosamente',
									'Error al regenerar el reparto',
								)
							}
						/>
					) : undefined
				}
			/>

			{canImportStudents && (
				<StudentImportContainer
					courseId={courseId}
					courseName={localizeCourseName(course.fullName)}
					open={isImportOpen}
					onOpenChange={setIsImportOpen}
				/>
			)}

			{canManageSubjects && (
				<Dialog
					open={subjectModalState.open}
					onOpenChange={(open) =>
						setSubjectModalState((prev) => ({ ...prev, open }))
					}
				>
					<DialogContent className="sm:max-w-[500px]">
						<DialogHeader>
							<DialogTitle>
								{subjectModalState.subject
									? `Editar Materia: ${subjectModalState.subject.name}`
									: 'Nueva Materia para el Curso'}
							</DialogTitle>
						</DialogHeader>

						<SubjectForm
							courseId={courseId}
							isEditing={Boolean(subjectModalState.subject)}
							defaultValues={
								subjectModalState.subject
									? {
											name: subjectModalState.subject.name,
											area: subjectModalState.subject.area,
											weeklyHours: subjectModalState.subject.weeklyHours,
											teacherId: subjectModalState.subject.teacherId || '',
											teacherName: subjectModalState.subject.teacherId
												? ''
												: subjectModalState.subject.teacherName || '',
											kind: subjectModalState.subject.kind,
										}
									: undefined
							}
							onSubmit={handleSaveSubject}
							teachers={teachers?.items || []}
							isLoading={
								createSubjectMutation.isPending || updateSubjectMutation.isPending
							}
							onCancel={() => setSubjectModalState({ open: false, subject: null })}
						/>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
