/**
 * Students module — pure mappings between the product's URL/form shapes and
 * the demo store inputs.
 *
 * Framework-free by design: the vitest suite covers it without jsdom.
 *
 * Two concerns, both inherited from the product pages:
 *
 * - `/students` list params: the product keeps search / courseId / status /
 *   page in the URL and re-reads them on every change; the demo parses them
 *   into the shape `StudentsPage` and the `getStudents` selector both accept.
 * - Student form values: the product reuses `CreateStudentFormValues` for
 *   create and update, while the store takes `CreateStudentInput` /
 *   `UpdateStudentInput`. The updatable set deliberately drops `courseId`: the
 *   product changes a course through the dedicated enroll/transfer endpoints
 *   (and its update DTO ignores it), and the store would otherwise move the
 *   student while leaving a stale `courseName`.
 */

import {
	type CreateStudentFormValues,
	type IStudentDetailResponse,
	STUDENT_ROUTES,
} from '@repo/common';
import type { StudentFiltersState } from '@repo/ui';
import type { UpdateStudentInput } from '../store/types';

/** Page size requested by the product students page (10 rows per page). */
export const STUDENTS_PAGE_SIZE = 10;

const DEFAULT_PAGE = 1;

/** Minimal shape of the read-only search params returned by next/navigation. */
export interface SearchParamsReader {
	get(name: string): string | null;
}

/**
 * Demo-only student routes, built on the product route catalog so the demo
 * never hardcodes an `/students` prefix.
 *
 * Note: the product edits inline (`/students/[id]?edit=true`); the demo uses
 * real routes for both create and edit.
 */
export const DEMO_STUDENT_ROUTES = {
	new: `${STUDENT_ROUTES.students}/new`,
	edit: (studentId: string) => `${STUDENT_ROUTES.student(studentId)}/edit`,
} as const;

/** List filters + page parsed from the `/students` query string. */
export interface StudentListParams {
	filters: StudentFiltersState;
	page: number;
}

/**
 * Read the `/students` query string into the product filter state and page
 * number. Empty values collapse to `undefined` (the "no filter" case the
 * selectors and `StudentFilters` expect) and a non-numeric page falls back to
 * the first page.
 */
export function parseStudentListParams(
	params: SearchParamsReader,
): StudentListParams {
	const pageParam = Number.parseInt(params.get('page') || `${DEFAULT_PAGE}`, 10);
	return {
		filters: {
			search: readParam(params, 'search'),
			courseId: readParam(params, 'courseId'),
			status: readParam(params, 'status'),
		},
		page: Number.isNaN(pageParam) ? DEFAULT_PAGE : pageParam,
	};
}

/** Pick the student fields the store can update (no course change). */
export function toUpdateStudentInput(
	values: CreateStudentFormValues,
): UpdateStudentInput {
	return {
		firstName: values.firstName,
		lastName: values.lastName,
		documentNumber: values.documentNumber,
		birthDate: values.birthDate,
		tutorName: values.tutorName,
		tutorPhone: values.tutorPhone,
		tutorEmail: values.tutorEmail,
	};
}

/** Seed `StudentForm` (edit mode) with a student read from the store. */
export function toStudentFormDefaults(
	student: IStudentDetailResponse,
): Partial<CreateStudentFormValues> {
	return {
		firstName: student.firstName,
		lastName: student.lastName,
		documentNumber: student.documentNumber,
		birthDate: toDateInputValue(student.birthDate),
		courseId: student.courseId,
		tutorName: student.tutorName,
		tutorPhone: student.tutorPhone,
		tutorEmail: student.tutorEmail ?? '',
	};
}

/** Normalize a student birth date into the `YYYY-MM-DD` a date input wants. */
export function toDateInputValue(value: string | Date | undefined): string {
	if (!value) return '';
	return value instanceof Date
		? value.toISOString().slice(0, 10)
		: (value.split('T')[0] ?? '');
}

function readParam(
	params: SearchParamsReader,
	key: string,
): string | undefined {
	return params.get(key) || undefined;
}
