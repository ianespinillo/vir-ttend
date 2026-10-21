import { describe, expect, it } from 'vitest';
import { SHIFT } from '../constants/shift.enum.js';
import { describeShiftScope } from './shift-scope.js';

describe('describeShiftScope', () => {
	it('is empty when the whole day is suspended', () => {
		expect(describeShiftScope(undefined)).toBe('');
		expect(describeShiftScope([])).toBe('');
	});

	it('names a single shift', () => {
		expect(describeShiftScope([SHIFT.MORNING])).toBe('turno mañana');
	});

	it('joins several shifts in Spanish', () => {
		expect(describeShiftScope([SHIFT.MORNING, SHIFT.AFTERNOON])).toBe(
			'turnos mañana y tarde',
		);
		expect(
			describeShiftScope([SHIFT.MORNING, SHIFT.AFTERNOON, SHIFT.EVENING]),
		).toBe('turnos mañana, tarde y noche');
	});
});
