import { describe, expect, it } from 'vitest';
import { LEVEL } from './level.enum.js';
import { isWorkshopOnlyCourse } from './workshop-only-course.js';

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
