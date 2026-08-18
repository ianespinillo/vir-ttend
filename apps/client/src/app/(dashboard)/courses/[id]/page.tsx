'use client';

import { useAuth } from '@/lib/auth/provider';
import type {
	CreateCourseFormValues,
	CreateSubjectFormValues,
	ISubjectResponse,
	ScheduleSlotFormValues,
} from '@repo/common';
import {
	useAcademicYears,
	useCourse,
	useCreateSubject,
	useDeleteCourse,
	useDeleteSubject,
	useSchedule,
	useSetSchedule,
	useSubjects,
	useUpdateCourse,
	useUpdateSubject,
	useUsersByRole,
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
} from '@repo/ui';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function CourseDetailPage() {
	const params = useParams();
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user } = useAuth();

	const courseId = Array.isArray(params.id) ? params.id[0] : params.id || '';
	const isEditQuery = searchParams.get('edit') === 'true';
	const [isEditingCourse, setIsEditingCourse] = useState(isEditQuery);

	const role = user?.role?.toLowerCase();
	const isAdmin = role === 'admin' || role === 'superadmin';

	const { data: course, isLoading, isError, error } = useCourse(courseId);
	const { data: subjectsData } = useSubjects(courseId);
	const { data: scheduleData } = useSchedule(courseId);
	const { data: academicYears } = useAcademicYears();
	const { data: preceptors } = useUsersByRole('preceptor');
	const { data: teachers } = useUsersByRole('teacher');

	const updateCourseMutation = useUpdateCourse();
	const deleteCourseMutation = useDeleteCourse();
	const createSubjectMutation = useCreateSubject();
	const updateSubjectMutation = useUpdateSubject();
	const deleteSubjectMutation = useDeleteSubject();
	const setScheduleMutation = useSetSchedule();

	const [subjectModalState, setSubjectModalState] = useState<{
		open: boolean;
		subject: ISubjectResponse | null;
	}>({ open: false, subject: null });

	const handleBack = () => {
		router.push('/courses');
	};

	const handleUpdateCourse = async (values: CreateCourseFormValues) => {
		await updateCourseMutation.mutateAsync({
			id: courseId,
			data: values,
		});
		setIsEditingCourse(false);
		router.replace(`/courses/${courseId}`);
	};

	const handleDeleteCourse = async () => {
		if (
			course &&
			window.confirm(
				`¿Está seguro de que desea eliminar el curso ${course.fullName}?`,
			)
		) {
			await deleteCourseMutation.mutateAsync(courseId);
			router.push('/courses');
		}
	};

	const handleSaveSubject = async (values: CreateSubjectFormValues) => {
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
		setSubjectModalState({ open: false, subject: null });
	};

	const handleDeleteSubject = async (subject: ISubjectResponse) => {
		if (
			window.confirm(
				`¿Está seguro de que desea eliminar la materia ${subject.name}?`,
			)
		) {
			await deleteSubjectMutation.mutateAsync({
				id: subject.id,
				courseId,
			});
		}
	};

	const handleSaveSchedule = async (slots: ScheduleSlotFormValues[]) => {
		await setScheduleMutation.mutateAsync({
			courseId,
			slots,
		});
	};

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
					title={`Editar: ${course.fullName}`}
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
				onAddSubject={() => setSubjectModalState({ open: true, subject: null })}
				onEditSubject={(subject) => setSubjectModalState({ open: true, subject })}
				onDeleteSubject={handleDeleteSubject}
				onSaveSchedule={handleSaveSchedule}
				canManage={isAdmin}
				studentsPath={`/students?courseId=${course.id}`}
				attendancePath={`/attendance?courseId=${course.id}`}
			/>

			{isAdmin && (
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
