import { describe, expect, it } from 'vitest';
import { LEVEL } from './level.enum.js';
import { SUBJECT_KIND } from './subject-kind.enum.js';
import {
	hasSubjectAttendance,
	isWorkshopOnlyCourse,
} from './workshop-only-course.js';

describe('isWorkshopOnlyCourse', () => {
	it('is true for the 7th year of a secondary (technical) course', () => {
		expect(isWorkshopOnlyCourse({ level: LEVEL.SECONDARY, yearNumber: 7 })).toBe(
			true,
		);
	});

	it('is false for the 7th grade of primary', () => {
		expect(isWorkshopOnlyCourse({ level: LEVEL.PRIMARY, yearNumber: 7 })).toBe(
			false,
		);
	});

	it('is false for other secondary years', () => {
		expect(isWorkshopOnlyCourse({ level: LEVEL.SECONDARY, yearNumber: 6 })).toBe(
			false,
		);
	});

	it('is false when the year is unknown', () => {
		expect(
			isWorkshopOnlyCourse({ level: LEVEL.SECONDARY, yearNumber: undefined }),
		).toBe(false);
	});
});

describe('hasSubjectAttendance', () => {
	const seventh = { level: LEVEL.SECONDARY, yearNumber: 7 };
	const sixth = { level: LEVEL.SECONDARY, yearNumber: 6 };

	it('is false for a theory subject of a workshop-only course', () => {
		expect(
			hasSubjectAttendance({ kind: SUBJECT_KIND.THEORY, course: seventh }),
		).toBe(false);
	});

	it('is true for a workshop subject of a workshop-only course', () => {
		expect(
			hasSubjectAttendance({ kind: SUBJECT_KIND.WORKSHOP, course: seventh }),
		).toBe(true);
	});

	it('is true for a theory subject of any other course', () => {
		expect(
			hasSubjectAttendance({ kind: SUBJECT_KIND.THEORY, course: sixth }),
		).toBe(true);
		expect(
			hasSubjectAttendance({
				kind: SUBJECT_KIND.THEORY,
				course: { level: LEVEL.PRIMARY, yearNumber: 7 },
			}),
		).toBe(true);
	});
});
