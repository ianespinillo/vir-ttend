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

export default function StudentsListPage() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { state, session, selectors, store } = useDemo();

	const { filters, page } = parseStudentListParams(searchParams);

	const courses = selectors.getCourses(state);
	const students = selectors.getStudents(state, {
		search: filters.search,
		courseId: filters.courseId,
		status: filters.status,
		page,
		limit: STUDENTS_PAGE_SIZE,
	});

	const user = session.user;
	const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPERADMIN;
	const isPreceptor = user?.role === ROLES.PRECEPTOR;

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

	const handleEnrollSubmit = (studentId: string, targetCourseId: string) => {
		store.enrollStudent(studentId, targetCourseId);
	};

	const handleChangeCourseSubmit = (
		studentId: string,
		targetCourseId: string,
	) => {
		// Changing course keeps the student active; the demo store treats it as an enroll.
		store.enrollStudent(studentId, targetCourseId);
	};

	const handleTransferSubmit = (student: IStudentResponse) => {
		if (
			window.confirm(
				`¿Confirma el traslado de ${student.fullName} a otra escuela? El alumno quedará marcado como Transferido.`,
			)
		) {
			store.transferStudent(student.id, student.courseId);
		}
	};

	const handleDeactivate = (student: IStudentResponse) => {
		if (
			window.confirm(`¿Está seguro de que desea desactivar a ${student.fullName}?`)
		) {
			store.toggleStudentStatus(student.id, false);
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
