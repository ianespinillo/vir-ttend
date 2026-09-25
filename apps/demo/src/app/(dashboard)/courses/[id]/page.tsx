'use client';

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
	ROLES,
	STUDENT_ROUTES,
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
} from '@repo/ui';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

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
	const [subjectModalState, setSubjectModalState] = useState<{
		open: boolean;
		subject: ReturnType<typeof selectors.getSubjects>[number] | null;
	}>({ open: false, subject: null });
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const courseId = Array.isArray(params.id)
		? (params.id[0] ?? '')
		: (params.id ?? '');
	const user = session.user;
	const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPERADMIN;
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

	const handleUpdateCourse = (values: CreateCourseFormValues) => {
		if (!isAdmin) return;
		setErrorMsg(null);
		try {
			store.updateCourse(course.id, toUpdateCourseInput(values));
			setIsEditingCourse(false);
			router.replace(ACADEMIC_ROUTES.course(course.id));
		} catch (error: unknown) {
			setErrorMsg(error instanceof Error ? error.message : UPDATE_ERROR_FALLBACK);
		}
	};

	const handleSaveSubject = (values: CreateSubjectFormValues) => {
		if (!isAdmin) return;
		setErrorMsg(null);
		try {
			if (subjectModalState.subject) {
				store.updateSubject(
					subjectModalState.subject.id,
					toUpdateSubjectInput(values),
				);
			} else {
				store.createSubject(toCreateSubjectInput(values));
			}
			setSubjectModalState({ open: false, subject: null });
		} catch (error: unknown) {
			setErrorMsg(error instanceof Error ? error.message : UPDATE_ERROR_FALLBACK);
		}
	};

	if (isAdmin && isEditingCourse) {
		return (
			<div className="space-y-6">
				<PageHeader
					title={`Editar: ${course.fullName}`}
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
					preceptors={selectors
						.getUsers(state, { role: ROLES.PRECEPTOR, limit: 100 })
						.items.map(toUserResponse)}
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
				studentCount={selectors.getCourseStudents(state, course.id).length}
				onBack={handleBack}
				onEdit={isAdmin ? () => setIsEditingCourse(true) : undefined}
				onAddSubject={
					isAdmin
						? () => setSubjectModalState({ open: true, subject: null })
						: undefined
				}
				onEditSubject={
					isAdmin
						? (subject) => setSubjectModalState({ open: true, subject })
						: undefined
				}
				canManage={isAdmin}
				studentsPath={`${STUDENT_ROUTES.students}?courseId=${course.id}`}
				attendancePath={`${ATTENDANCE_ROUTES.daily}?courseId=${course.id}`}
			/>

			{isAdmin && (
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
							teachers={selectors
								.getUsers(state, { role: ROLES.TEACHER, limit: 100 })
								.items.map(toUserResponse)}
							isLoading={false}
							onCancel={() => setSubjectModalState({ open: false, subject: null })}
						/>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
