import {
	ACADEMIC_ROUTES,
	type CreateCourseFormValues,
	type CreateSubjectFormValues,
	ICourseResponse,
	ISubjectResponse,
	LEVEL,
	ROLES,
	SHIFT,
} from '@repo/common';
import { describe, expect, it } from 'vitest';
import {
	DEMO_COURSE_ROUTES,
	getScopedCourseIds,
	getScopedSubjects,
	toCourseFormDefaults,
	toCreateCourseInput,
	toCreateSubjectInput,
	toSubjectFormDefaults,
	toUpdateCourseInput,
	toUpdateSubjectInput,
	toUserResponse,
} from './academic-mappings';

const courses: ICourseResponse[] = [
	{
		id: 'course-a',
		academicYearId: 'year-a',
		level: LEVEL.PRIMARY,
		yearNumber: 1,
		division: 'A',
		shift: SHIFT.MORNING,
		preceptorId: 'preceptor-a',
		preceptorName: 'Ana Preceptora',
		fullName: '1º A',
	},
	{
		id: 'course-b',
		academicYearId: 'year-a',
		level: LEVEL.SECONDARY,
		yearNumber: 3,
		division: 'A',
		shift: SHIFT.MORNING,
		preceptorId: 'preceptor-b',
		preceptorName: 'Bruno Preceptor',
		fullName: '3º A',
	},
];

const subjects: ISubjectResponse[] = [
	{
		id: 'subject-a',
		courseId: 'course-a',
		name: 'Matemática',
		area: 'Matemática',
		weeklyHours: 4,
		teacherId: 'teacher-a',
		teacherName: 'Ada Docente',
	},
	{
		id: 'subject-b',
		courseId: 'course-b',
		name: 'Historia',
		area: 'Sociales',
		weeklyHours: 3,
		teacherId: 'teacher-b',
		teacherName: 'Beto Docente',
	},
	{
		id: 'subject-c',
		courseId: 'course-b',
		name: 'Sin docente',
		area: 'General',
		weeklyHours: 2,
	},
];

const courseFormValues: CreateCourseFormValues = {
	academicYearId: 'year-a',
	level: LEVEL.SECONDARY,
	yearNumber: 3,
	division: 'A',
	shift: SHIFT.MORNING,
	preceptorId: 'NONE',
	schoolId: 'school-a',
};

const subjectFormValues: CreateSubjectFormValues = {
	courseId: 'course-b',
	name: 'Biología',
	area: 'Ciencias Naturales',
	weeklyHours: 3,
	teacherId: 'NONE',
};

describe('academic role scoping', () => {
	it('returns all course ids for administrative roles', () => {
		expect(
			getScopedCourseIds(courses, subjects, 'admin-a', ROLES.ADMIN),
		).toBeUndefined();
		expect(
			getScopedCourseIds(courses, subjects, 'superadmin-a', ROLES.SUPERADMIN),
		).toBeUndefined();
	});

	it('limits preceptors to courses assigned to them', () => {
		expect(
			getScopedCourseIds(courses, subjects, 'preceptor-a', ROLES.PRECEPTOR),
		).toEqual(['course-a']);
	});

	it('limits teachers to courses containing one of their subjects', () => {
		expect(
			getScopedCourseIds(courses, subjects, 'teacher-a', ROLES.TEACHER),
		).toEqual(['course-a']);
	});

	it('returns no course ids without a recognized user scope', () => {
		expect(getScopedCourseIds(courses, subjects, undefined, undefined)).toEqual(
			[],
		);
	});

	it('scopes subjects by assignment for each non-administrative role', () => {
		expect(
			getScopedSubjects(courses, subjects, 'preceptor-b', ROLES.PRECEPTOR).map(
				(subject) => subject.id,
			),
		).toEqual(['subject-b', 'subject-c']);
		expect(
			getScopedSubjects(courses, subjects, 'teacher-a', ROLES.TEACHER).map(
				(subject) => subject.id,
			),
		).toEqual(['subject-a']);
	});

	it('returns all subjects for administrative roles', () => {
		expect(getScopedSubjects(courses, subjects, 'admin-a', ROLES.ADMIN)).toEqual(
			subjects,
		);
	});
});

describe('academic form mappings', () => {
	it('maps membership users to the form user contract', () => {
		expect(
			toUserResponse({
				id: 'preceptor-a',
				email: 'ana@example.com',
				firstName: 'Ana',
				lastName: 'Preceptora',
				role: ROLES.PRECEPTOR,
				isActive: true,
				mustChangePassword: false,
			}),
		).toEqual({
			id: 'preceptor-a',
			email: 'ana@example.com',
			firstName: 'Ana',
			lastName: 'Preceptora',
			role: ROLES.PRECEPTOR,
			tenantId: '',
			mustChangePassword: false,
		});
	});

	it('maps a course into the product form shape', () => {
		expect(toCourseFormDefaults(courses[1] as ICourseResponse)).toEqual({
			academicYearId: 'year-a',
			level: LEVEL.SECONDARY,
			yearNumber: 3,
			division: 'A',
			shift: SHIFT.MORNING,
			preceptorId: 'preceptor-b',
		});
	});

	it('maps a subject into the product form shape', () => {
		expect(toSubjectFormDefaults(subjects[0] as ISubjectResponse)).toEqual({
			name: 'Matemática',
			area: 'Matemática',
			weeklyHours: 4,
			teacherId: 'teacher-a',
		});
	});

	it('removes the sentinel and school-only field from course inputs', () => {
		expect(toCreateCourseInput(courseFormValues)).toEqual({
			academicYearId: 'year-a',
			level: LEVEL.SECONDARY,
			yearNumber: 3,
			division: 'A',
			shift: SHIFT.MORNING,
		});
		expect(toUpdateCourseInput(courseFormValues)).toEqual({
			level: LEVEL.SECONDARY,
			yearNumber: 3,
			division: 'A',
			shift: SHIFT.MORNING,
		});
	});

	it('removes the sentinel from subject inputs', () => {
		expect(toCreateSubjectInput(subjectFormValues)).toEqual({
			courseId: 'course-b',
			name: 'Biología',
			area: 'Ciencias Naturales',
			weeklyHours: 3,
		});
		expect(toUpdateSubjectInput(subjectFormValues)).toEqual({
			courseId: 'course-b',
			name: 'Biología',
			area: 'Ciencias Naturales',
			weeklyHours: 3,
		});
	});
});

describe('demo academic routes', () => {
	it('builds course routes from the shared academic route catalog', () => {
		expect(DEMO_COURSE_ROUTES.new).toBe(`${ACADEMIC_ROUTES.courses}/create`);
		expect(DEMO_COURSE_ROUTES.edit('course-a')).toBe(
			`${ACADEMIC_ROUTES.course('course-a')}?edit=true`,
		);
	});
});
