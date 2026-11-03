import { describe, expect, it } from 'vitest';
import {
	formatSlotTeacher,
	formatSubjectTeachers,
	hasCommissionTeachers,
} from './subject-teachers';

const split = {
	teacherName: 'Ana',
	teachers: [
		{ commissionNumber: 1 as const, teacherName: 'Ana' },
		{ commissionNumber: 2 as const, teacherName: 'Luis' },
	],
};
const whole = {
	teacherName: 'Marta',
	teachers: [{ commissionNumber: null, teacherName: 'Marta' }],
};

describe('subject teachers display', () => {
	it('shows one name per commission when split', () => {
		expect(hasCommissionTeachers(split)).toBe(true);
		expect(formatSubjectTeachers(split)).toBe('C1: Ana · C2: Luis');
	});

	it('marks a commission without teacher', () => {
		expect(
			formatSubjectTeachers({
				teachers: [{ commissionNumber: 2, teacherName: 'Luis' }],
			}),
		).toBe('C1: Sin asignar · C2: Luis');
	});

	it('shows the single name for a whole-subject teacher or legacy payloads', () => {
		expect(formatSubjectTeachers(whole)).toBe('Marta');
		expect(formatSubjectTeachers({ teacherName: 'Marta' })).toBe('Marta');
		expect(formatSubjectTeachers({})).toBeUndefined();
	});

	it('picks the slot commission teacher when split', () => {
		expect(formatSlotTeacher(split, 2)).toBe('Luis');
		expect(formatSlotTeacher(split, 1)).toBe('Ana');
		expect(formatSlotTeacher(split, null)).toBe('C1: Ana · C2: Luis');
		expect(formatSlotTeacher(whole, 2)).toBe('Marta');
	});
});
