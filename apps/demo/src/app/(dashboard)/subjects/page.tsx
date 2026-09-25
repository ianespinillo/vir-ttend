'use client';

import {
	getScopedSubjects,
	toCreateSubjectInput,
	toSubjectFormDefaults,
	toUpdateSubjectInput,
	toUserResponse,
} from '@/lib/academic/academic-mappings';
import { useDemo } from '@/lib/session/demo-provider';
import { type CreateSubjectFormValues, ROLES } from '@repo/common';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	PageHeader,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	SubjectForm,
	SubjectsList,
} from '@repo/ui';
import { useState } from 'react';

const SUBJECT_ERROR_FALLBACK =
	'Ocurrió un error al guardar la materia. Intente nuevamente.';

export default function SubjectsPage() {
	const { state, session, selectors, store } = useDemo();
	const [subjectModalState, setSubjectModalState] = useState<{
		open: boolean;
		subject: ReturnType<typeof selectors.getSubjects>[number] | null;
	}>({ open: false, subject: null });
	const [selectedCourseId, setSelectedCourseId] = useState('');
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const user = session.user;
	const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPERADMIN;
	const courses = selectors.getCourses(state);
	const subjects = getScopedSubjects(
		courses,
		selectors.getSubjects(state),
		user?.id,
		user?.role,
	);
	const courseId =
		(subjectModalState.subject?.courseId ?? selectedCourseId) ||
		courses[0]?.id ||
		'';

	const openCreateDialog = () => {
		setSelectedCourseId(courses[0]?.id ?? '');
		setSubjectModalState({ open: true, subject: null });
	};

	const openEditDialog = (
		subject: ReturnType<typeof selectors.getSubjects>[number],
	) => {
		setSelectedCourseId(subject.courseId ?? '');
		setSubjectModalState({ open: true, subject });
	};

	const handleSaveSubject = (values: CreateSubjectFormValues) => {
		if (!isAdmin) return;
		setErrorMsg(null);
		try {
			const subjectValues = { ...values, courseId: courseId || values.courseId };
			if (subjectModalState.subject) {
				store.updateSubject(
					subjectModalState.subject.id,
					toUpdateSubjectInput(subjectValues),
				);
			} else {
				store.createSubject(toCreateSubjectInput(subjectValues));
			}
			setSubjectModalState({ open: false, subject: null });
		} catch (error: unknown) {
			setErrorMsg(error instanceof Error ? error.message : SUBJECT_ERROR_FALLBACK);
		}
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title="Gestión de Materias"
				description="Consulte y gestione las materias asignadas a los cursos"
			/>
			{errorMsg && (
				<div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
					{errorMsg}
				</div>
			)}

			<SubjectsList
				subjects={subjects}
				onAddSubject={isAdmin ? openCreateDialog : undefined}
				onEditSubject={isAdmin ? openEditDialog : undefined}
				canManage={isAdmin}
				isLoading={false}
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
									: 'Nueva Materia'}
							</DialogTitle>
						</DialogHeader>
						{!subjectModalState.subject && (
							<div className="space-y-2">
								<label className="text-sm font-medium" htmlFor="subject-course">
									Curso *
								</label>
								<Select
									value={selectedCourseId || undefined}
									onValueChange={setSelectedCourseId}
								>
									<SelectTrigger id="subject-course">
										<SelectValue placeholder="Seleccione un curso" />
									</SelectTrigger>
									<SelectContent>
										{courses.map((course) => (
											<SelectItem key={course.id} value={course.id}>
												{course.fullName}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
						<SubjectForm
							courseId={courseId}
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
