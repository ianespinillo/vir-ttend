'use client';

/**
 * Demo `/courses/[id]` — the product course detail, fed by the demo store.
 *
 * Mirrors `apps/client/src/app/(dashboard)/courses/[id]/page.tsx`: course
 * header with subjects, weekly schedule (with workshop commissions) and the
 * students tab, plus the workshop commissions tab and the student import
 * dialog for admins and the course preceptor. Preceptors also manage the
 * schedule and the subjects of their courses.
 */

import { DemoStudentImportContainer } from '@/components/student-import-container';
import {
	getScopedCourseIds,
	getScopedSubjects,
	toCourseFormDefaults,
	toCreateSubjectInput,
	toSubjectFormDefaults,
	toUpdateCourseInput,
	toUpdateSubjectInput,
	toUserResponse,
} from '@/lib/academic/academic-mappings';
import { useDemo } from '@/lib/session/demo-provider';
import {
	ACADEMIC_ROUTES,
	ATTENDANCE_ROUTES,
	type CreateCourseFormValues,
	type CreateSubjectFormValues,
	type ISubjectResponse,
	ROLES,
	STUDENTSTATUS,
	STUDENT_ROUTES,
	type ScheduleSlotFormValues,
} from '@repo/common';
import {
	CourseDetail,
	CourseForm,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	ErrorState,
	PageHeader,
	SubjectForm,
	WorkshopCommissionsPanel,
	localizeCourseName,
} from '@repo/ui';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

const UPDATE_ERROR_FALLBACK =
	'Ocurrió un error al actualizar el curso. Intente nuevamente.';

export default function CourseDetailPage() {
	const params = useParams();
	const router = useRouter();
	const searchParams = useSearchParams();
	const { state, session, selectors, store } = useDemo();
	const [isEditingCourse, setIsEditingCourse] = useState(
		searchParams.get('edit') === 'true',
	);
	const [isImportOpen, setIsImportOpen] = useState(false);
	const [subjectModalState, setSubjectModalState] = useState<{
		open: boolean;
		subject: ISubjectResponse | null;
	}>({ open: false, subject: null });
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const courseId = Array.isArray(params.id)
		? (params.id[0] ?? '')
		: (params.id ?? '');
	const user = session.user;
	const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPERADMIN;
	const isPreceptor = user?.role === ROLES.PRECEPTOR;
	const canManageSchedule = isAdmin || isPreceptor;
	const canManageSubjects = isAdmin || isPreceptor;
	const courseIds = getScopedCourseIds(
		selectors.getCourses(state),
		selectors.getSubjects(state),
		user?.id,
		user?.role,
	);
	const course = selectors.getCourseDetail(state, courseId);
	const canViewCourse =
		course !== undefined &&
		(courseIds === undefined || courseIds.includes(course.id));

	const handleBack = () => {
		router.push(ACADEMIC_ROUTES.courses);
	};

	if (!course || !canViewCourse) {
		return (
			<ErrorState
				title="Error al cargar el curso"
				description="No se encontró la información del curso o no tiene acceso a ella."
				onRetry={handleBack}
			/>
		);
	}

	// The course preceptor reorganizes, imports and assigns commission
	// preceptors.
	const isCoursePreceptor = isPreceptor && course.preceptorId === user?.id;
	const canImportStudents = isAdmin || isCoursePreceptor;
	const canManageCommissions = isAdmin || isCoursePreceptor;

	const visibleSubjects = getScopedSubjects(
		selectors.getCourses(state),
		selectors.getSubjects(state),
		user?.id,
		user?.role,
	).filter((subject) => subject.courseId === course.id);
	const visibleSubjectIds = new Set(
		visibleSubjects.map((subject) => subject.id),
	);
	const visibleSchedule = selectors
		.getSchedule(state, course.id)
		.filter((slot) => visibleSubjectIds.has(slot.subjectId));
	const commissions = selectors.getWorkshopCommissions(state, course.id);
	const activeStudents = selectors.getStudents(state, {
		courseId: course.id,
		status: STUDENTSTATUS.ACTIVE,
		limit: 100,
	});
	const teachers = selectors
		.getUsers(state, { role: ROLES.TEACHER, limit: 100 })
		.items.map(toUserResponse);
	const preceptors = selectors
		.getUsers(state, { role: ROLES.PRECEPTOR, limit: 100 })
		.items.map(toUserResponse);

	const run = (
		action: () => unknown,
		successMessage: string,
		fallbackError: string,
	) => {
		try {
			action();
			toast.success(successMessage);
		} catch (error: unknown) {
			toast.error(error instanceof Error ? error.message : fallbackError);
		}
	};

	const handleUpdateCourse = (values: CreateCourseFormValues) => {
		if (!isAdmin) return;
		setErrorMsg(null);
		try {
			store.updateCourse(course.id, toUpdateCourseInput(values));
			setIsEditingCourse(false);
			router.replace(ACADEMIC_ROUTES.course(course.id));
			toast.success('Curso actualizado exitosamente');
		} catch (error: unknown) {
			setErrorMsg(error instanceof Error ? error.message : UPDATE_ERROR_FALLBACK);
		}
	};

	const handleSaveSubject = (values: CreateSubjectFormValues) => {
		if (!canManageSubjects) return;
		setErrorMsg(null);
		const isEditing = Boolean(subjectModalState.subject);
		try {
			const subjectValues = { ...values, courseId: course.id };
			if (subjectModalState.subject) {
				store.updateSubject(
					subjectModalState.subject.id,
					toUpdateSubjectInput(subjectValues),
				);
			} else {
				store.createSubject(toCreateSubjectInput(subjectValues));
			}
			setSubjectModalState({ open: false, subject: null });
			toast.success(
				isEditing
					? 'Materia actualizada exitosamente'
					: 'Materia agregada exitosamente',
			);
		} catch (error: unknown) {
			setErrorMsg(error instanceof Error ? error.message : UPDATE_ERROR_FALLBACK);
		}
	};

	const handleDeleteSubject = (subject: ISubjectResponse) => {
		if (
			window.confirm(
				`¿Está seguro de que desea eliminar la materia ${subject.name}?`,
			)
		) {
			run(
				() => store.deleteSubject(subject.id),
				'Materia eliminada exitosamente',
				'Error al eliminar la materia',
			);
		}
	};

	const handleSaveSchedule = (slots: ScheduleSlotFormValues[]) => {
		run(
			() => store.setSchedule(course.id, slots),
			'Horarios guardados exitosamente',
			'Error al guardar los horarios',
		);
	};

	if (isAdmin && isEditingCourse) {
		return (
			<div className="space-y-6">
				<PageHeader
					title={`Editar: ${localizeCourseName(course.fullName)}`}
					description="Modifique la información del curso o la asignación de preceptor"
				/>
				{errorMsg && (
					<div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
						{errorMsg}
					</div>
				)}
				<CourseForm
					isEditing
					defaultValues={toCourseFormDefaults(course)}
					onSubmit={handleUpdateCourse}
					isLoading={false}
					academicYears={selectors.getAcademicYears(state)}
					preceptors={preceptors}
					onCancel={() => setIsEditingCourse(false)}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{errorMsg && (
				<div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
					{errorMsg}
				</div>
			)}
			<CourseDetail
				course={course}
				subjects={visibleSubjects}
				schedule={visibleSchedule}
				studentCount={activeStudents.total}
				students={activeStudents.items}
				onViewStudent={(id) => router.push(STUDENT_ROUTES.student(id))}
				onBack={handleBack}
				onEdit={isAdmin ? () => setIsEditingCourse(true) : undefined}
				onAddSubject={
					canManageSubjects
						? () => setSubjectModalState({ open: true, subject: null })
						: undefined
				}
				onEditSubject={
					canManageSubjects
						? (subject) => setSubjectModalState({ open: true, subject })
						: undefined
				}
				onDeleteSubject={isAdmin ? handleDeleteSubject : undefined}
				onSaveSchedule={handleSaveSchedule}
				onImportStudents={
					canImportStudents ? () => setIsImportOpen(true) : undefined
				}
				canManage={isAdmin}
				canManageSchedule={canManageSchedule}
				canManageSubjects={canManageSubjects}
				attendancePath={`${ATTENDANCE_ROUTES.daily}?courseId=${course.id}`}
				commissionNumbers={commissions.map((commission) => commission.number)}
				commissionsTab={
					canManageCommissions ? (
						<WorkshopCommissionsPanel
							commissions={commissions}
							preceptors={preceptors}
							onCreate={(count) =>
								run(
									() => store.createWorkshopCommissions(course.id, count),
									'Comisiones creadas exitosamente',
									'Error al crear las comisiones',
								)
							}
							onAssignPreceptor={
								canManageCommissions
									? (commissionId, preceptorId) =>
											run(
												() => store.assignCommissionPreceptor(commissionId, preceptorId),
												'Preceptor de la comisión actualizado',
												'Error al asignar el preceptor',
											)
									: undefined
							}
							onMoveStudent={(commissionId, studentId) =>
								run(
									() => store.moveStudentToCommission(commissionId, studentId),
									'Estudiante movido de comisión',
									'Error al mover al estudiante',
								)
							}
							onRegenerate={() =>
								run(
									() => store.regenerateWorkshopCommissions(course.id),
									'Reparto regenerado exitosamente',
									'Error al regenerar el reparto',
								)
							}
						/>
					) : undefined
				}
			/>

			{canImportStudents && (
				<DemoStudentImportContainer
					courseId={course.id}
					courseName={localizeCourseName(course.fullName)}
					open={isImportOpen}
					onOpenChange={setIsImportOpen}
				/>
			)}

			{canManageSubjects && (
				<Dialog
					open={subjectModalState.open}
					onOpenChange={(open) =>
						setSubjectModalState((previous) => ({ ...previous, open }))
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
							courseId={course.id}
							isEditing={Boolean(subjectModalState.subject)}
							defaultValues={
								subjectModalState.subject
									? toSubjectFormDefaults(subjectModalState.subject)
									: undefined
							}
							onSubmit={handleSaveSubject}
							teachers={teachers}
							isLoading={false}
							onCancel={() => setSubjectModalState({ open: false, subject: null })}
						/>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
