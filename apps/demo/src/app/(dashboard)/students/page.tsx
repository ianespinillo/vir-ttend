'use client';

/**
 * Demo `/students` — the product students list, fed by the demo store.
 *
 * Mirrors `apps/client/src/app/(dashboard)/students/page.tsx` 1:1: the same
 * `StudentsPage` panel, the same URL-driven filters/pagination (search,
 * courseId, status, page) and the same row actions. Only the data source
 * changes: `useStudents`/`useCourses`/`useEnrollStudent`/`useTransferStudent`/
 * `useDeleteStudent` become `selectors.getStudents`/`selectors.getCourses` plus
 * the store actions (enroll, transfer, deactivate).
 *
 * Ordering note: the product API orders by lastName/firstName; the demo keeps
 * the seeded roster order on purpose so the showcase profiles (Benítez 100%,
 * Rossi 12% WARNING, Díaz 18% CRITICAL) stay on the first page of the demo.
 */

import { getScopedCourseIds } from '@/lib/academic/academic-mappings';
import { useDemo } from '@/lib/session/demo-provider';
import {
	DEMO_STUDENT_ROUTES,
	STUDENTS_PAGE_SIZE,
	parseStudentListParams,
} from '@/lib/students/student-mappings';
import { type IStudentResponse, ROLES, STUDENT_ROUTES } from '@repo/common';
import { type StudentFiltersState, StudentsPage } from '@repo/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { toast } from 'sonner';

export default function StudentsListPage() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { state, session, selectors, store } = useDemo();

	const { filters, page } = parseStudentListParams(searchParams);

	const user = session.user;
	const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPERADMIN;
	const isPreceptor = user?.role === ROLES.PRECEPTOR;

	const allCourses = selectors.getCourses(state);
	const allSubjects = selectors.getSubjects(state);
	const scopedCourseIds = getScopedCourseIds(
		allCourses,
		allSubjects,
		user?.id,
		user?.role,
	);
	const courses = selectors.getCourses(state, scopedCourseIds);

	const effectiveCourseId = filters.courseId;
	let shouldReturnEmpty = false;
	if (scopedCourseIds) {
		if (filters.courseId) {
			if (!scopedCourseIds.includes(filters.courseId)) {
				shouldReturnEmpty = true;
			}
		} else if (scopedCourseIds.length === 0) {
			shouldReturnEmpty = true;
		}
	}

	const rawStudents = shouldReturnEmpty
		? { items: [], total: 0, page, limit: STUDENTS_PAGE_SIZE, totalPages: 0 }
		: selectors.getStudents(state, {
				search: filters.search,
				courseId: effectiveCourseId,
				status: filters.status,
				page: scopedCourseIds && !filters.courseId ? 1 : page,
				limit: scopedCourseIds && !filters.courseId ? 1000 : STUDENTS_PAGE_SIZE,
			});

	const students =
		scopedCourseIds && !filters.courseId && !shouldReturnEmpty
			? (() => {
					const filteredItems = rawStudents.items.filter(
						(s) => s.courseId && scopedCourseIds.includes(s.courseId),
					);
					const offset = (page - 1) * STUDENTS_PAGE_SIZE;
					return {
						items: filteredItems.slice(offset, offset + STUDENTS_PAGE_SIZE),
						total: filteredItems.length,
						page,
						limit: STUDENTS_PAGE_SIZE,
						totalPages: Math.ceil(filteredItems.length / STUDENTS_PAGE_SIZE) || 1,
					};
				})()
			: rawStudents;

	const updateQueryParams = useCallback(
		(newParams: Record<string, string | number | undefined>) => {
			const params = new URLSearchParams(searchParams.toString());
			for (const [key, val] of Object.entries(newParams)) {
				if (val === undefined || val === '') {
					params.delete(key);
				} else {
					params.set(key, String(val));
				}
			}
			router.push(`${pathname}?${params.toString()}`);
		},
		[pathname, router, searchParams],
	);

	const handleFiltersChange = (newFilters: StudentFiltersState) => {
		updateQueryParams({
			search: newFilters.search,
			courseId: newFilters.courseId,
			status: newFilters.status,
			page: 1, // Reset to page 1 on filter change
		});
	};

	const handlePageChange = (newPage: number) => {
		updateQueryParams({ page: newPage });
	};

	const handleView = (id: string) => {
		router.push(STUDENT_ROUTES.student(id));
	};

	const handleCreate = () => {
		router.push(DEMO_STUDENT_ROUTES.new);
	};

	const handleEdit = (id: string) => {
		router.push(DEMO_STUDENT_ROUTES.edit(id));
	};

	/** Runs a store action and reports it like the product (toast + "Ver alumno"). */
	const runStudentAction = (
		studentId: string,
		action: () => unknown,
		successMessage: string,
		errorFallback: string,
	) => {
		try {
			action();
			toast.success(successMessage, {
				action: {
					label: 'Ver alumno',
					onClick: () => router.push(STUDENT_ROUTES.student(studentId)),
				},
			});
		} catch (error: unknown) {
			toast.error(error instanceof Error ? error.message : errorFallback);
		}
	};

	const handleEnrollSubmit = (studentId: string, targetCourseId: string) => {
		runStudentAction(
			studentId,
			() => store.enrollStudent(studentId, targetCourseId),
			'Estudiante matriculado exitosamente',
			'Error al matricular el estudiante',
		);
	};

	const handleChangeCourseSubmit = (
		studentId: string,
		targetCourseId: string,
	) => {
		// Changing course keeps the student active; the demo store treats it as an enroll.
		runStudentAction(
			studentId,
			() => store.enrollStudent(studentId, targetCourseId),
			'Curso cambiado exitosamente',
			'Error al cambiar el curso del estudiante',
		);
	};

	const handleTransferSubmit = (student: IStudentResponse) => {
		if (
			window.confirm(
				`¿Confirma el traslado de ${student.fullName} a otra escuela? El alumno quedará marcado como Transferido.`,
			)
		) {
			runStudentAction(
				student.id,
				() => store.transferStudent(student.id, student.courseId),
				'Estudiante trasladado a otra escuela',
				'Error al trasladar el estudiante',
			);
		}
	};

	const handleDeactivate = (student: IStudentResponse) => {
		if (
			window.confirm(`¿Está seguro de que desea desactivar a ${student.fullName}?`)
		) {
			try {
				store.toggleStudentStatus(student.id, false);
				toast.success('Estudiante desactivado exitosamente');
			} catch (error: unknown) {
				toast.error(
					error instanceof Error
						? error.message
						: 'Error al desactivar el estudiante',
				);
			}
		}
	};

	return (
		<StudentsPage
			students={students.items}
			total={students.total}
			page={students.page}
			totalPages={students.totalPages}
			isLoading={false}
			filters={filters}
			onFiltersChange={handleFiltersChange}
			onPageChange={handlePageChange}
			courses={courses}
			onView={handleView}
			onCreate={handleCreate}
			onEdit={handleEdit}
			onEnrollSubmit={handleEnrollSubmit}
			onChangeCourseSubmit={handleChangeCourseSubmit}
			onTransferSubmit={handleTransferSubmit}
			onDeactivate={handleDeactivate}
			isAdmin={isAdmin}
			isPreceptor={isPreceptor}
		/>
	);
}
