import { SHIFT } from '@repo/common';
import { describe, expect, it } from 'vitest';
import {
	SHIFT_LABELS,
	formatShift,
	formatShiftScope,
	localizeCourseName,
} from './shift';

describe('formatShiftScope', () => {
	it('means every shift when the scope is empty or missing', () => {
		expect(formatShiftScope(undefined)).toBe('Todos los turnos');
		expect(formatShiftScope(null)).toBe('Todos los turnos');
		expect(formatShiftScope([])).toBe('Todos los turnos');
	});

	it('lists the labels of the scoped shifts', () => {
		expect(formatShiftScope([SHIFT.MORNING])).toBe('Mañana');
		expect(formatShiftScope([SHIFT.MORNING, SHIFT.EVENING])).toBe(
			'Mañana, Noche',
		);
	});
});

describe('shift labels', () => {
	it('maps every shift enum value to Spanish', () => {
		expect(SHIFT_LABELS[SHIFT.MORNING]).toBe('Mañana');
		expect(SHIFT_LABELS[SHIFT.AFTERNOON]).toBe('Tarde');
		expect(SHIFT_LABELS[SHIFT.EVENING]).toBe('Noche');
	});

	it('formatShift maps enum values and falls back for empty/unknown', () => {
		expect(formatShift(SHIFT.MORNING)).toBe('Mañana');
		expect(formatShift('AFTERNOON')).toBe('Tarde');
		expect(formatShift('')).toBe('');
		expect(formatShift(undefined)).toBe('');
		expect(formatShift('CUSTOM')).toBe('CUSTOM');
	});

	it('localizeCourseName translates the embedded English shift', () => {
		expect(localizeCourseName('4° 2 - MORNING')).toBe('4° 2 - Mañana');
		expect(localizeCourseName('6° 1 - AFTERNOON')).toBe('6° 1 - Tarde');
		expect(localizeCourseName('1° 1 - EVENING')).toBe('1° 1 - Noche');
	});

	it('localizeCourseName leaves names without a shift untouched', () => {
		expect(localizeCourseName('4° 2')).toBe('4° 2');
		expect(localizeCourseName('')).toBe('');
		expect(localizeCourseName(undefined)).toBe('');
	});
});
