import type {
	CreateStudentFormValues,
	IStudentDetailResponse,
} from '@repo/common';
import { describe, expect, it } from 'vitest';
import {
	DEMO_STUDENT_ROUTES,
	parseStudentListParams,
	toDateInputValue,
	toStudentFormDefaults,
	toUpdateStudentInput,
} from './student-mappings';

function paramsFrom(query: string) {
	return new URLSearchParams(query);
}

function makeStudent(
	overrides: Partial<IStudentDetailResponse> = {},
): IStudentDetailResponse {
	return {
		id: 'student-1',
		fullName: 'Sofía Rossi',
		firstName: 'Sofía',
		lastName: 'Rossi',
		documentNumber: '40123402',
		birthDate: '2013-04-22',
		age: 13,
		courseId: 'course-3a',
		courseName: '3º Año A',
		status: 'ACTIVE',
		tutorName: 'Marcela Rossi',
		tutorPhone: '11-2345-6702',
		tutorEmail: 'marcela.rossi@gmail.com',
		...overrides,
	};
}

const FORM_VALUES: CreateStudentFormValues = {
	firstName: 'Sofía',
	lastName: 'Rossi',
	documentNumber: '40123402',
	birthDate: '2013-04-22',
	courseId: 'course-3a',
	tutorName: 'Marcela Rossi',
	tutorPhone: '11-2345-6702',
	tutorEmail: 'marcela.rossi@gmail.com',
};

describe('students list params', () => {
	it('reads search, course, status and page from the query string', () => {
		const parsed = parseStudentListParams(
			paramsFrom('search=rossi&courseId=course-3a&status=ACTIVE&page=2'),
		);
		expect(parsed.filters).toEqual({
			search: 'rossi',
			courseId: 'course-3a',
			status: 'ACTIVE',
		});
		expect(parsed.page).toBe(2);
	});

	it('defaults to no filters and the first page', () => {
		const parsed = parseStudentListParams(paramsFrom(''));
		expect(parsed.filters).toEqual({
			search: undefined,
			courseId: undefined,
			status: undefined,
		});
		expect(parsed.page).toBe(1);
	});

	it('treats empty and non-numeric values as unset', () => {
		const parsed = parseStudentListParams(paramsFrom('search=&page=abc'));
		expect(parsed.filters.search).toBeUndefined();
		expect(parsed.page).toBe(1);
	});
});

describe('student form mappings', () => {
	it('keeps the student data on update and drops the course', () => {
		expect(toUpdateStudentInput(FORM_VALUES)).toEqual({
			firstName: 'Sofía',
			lastName: 'Rossi',
			documentNumber: '40123402',
			birthDate: '2013-04-22',
			tutorName: 'Marcela Rossi',
			tutorPhone: '11-2345-6702',
			tutorEmail: 'marcela.rossi@gmail.com',
		});
		expect(toUpdateStudentInput(FORM_VALUES)).not.toHaveProperty('courseId');
	});

	it('seeds the edit form from a student, with an empty optional email', () => {
		expect(toStudentFormDefaults(makeStudent({ tutorEmail: undefined }))).toEqual(
			{ ...FORM_VALUES, tutorEmail: '' },
		);
		expect(toStudentFormDefaults(makeStudent())).toEqual(FORM_VALUES);
	});

	it('normalizes student birth dates into date input values', () => {
		expect(toDateInputValue('2013-04-22')).toBe('2013-04-22');
		expect(toDateInputValue('2013-04-22T00:00:00.000Z')).toBe('2013-04-22');
		expect(toDateInputValue(new Date('2013-04-22T00:00:00.000Z'))).toBe(
			'2013-04-22',
		);
		expect(toDateInputValue('')).toBe('');
		expect(toDateInputValue(undefined)).toBe('');
	});
});

describe('demo student routes', () => {
	it('builds the create and edit routes from the product catalog', () => {
		expect(DEMO_STUDENT_ROUTES.new).toBe('/students/new');
		expect(DEMO_STUDENT_ROUTES.edit('abc')).toBe('/students/abc/edit');
	});
});
