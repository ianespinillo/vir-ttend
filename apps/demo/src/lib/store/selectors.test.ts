import { describe, expect, it } from 'vitest';
import {
	DEMO_INSTITUTIONAL_DAY,
	courseRiskStatus,
	generateLastBusinessDays,
	mondayOfWeek,
	paginate,
} from './selectors';
import { DEMO_ATTENDANCE_DAYS, DEMO_TODAY } from './types';

describe('math helpers (single source of truth)', () => {
	it('maps course risk with product thresholds (75 / 85)', () => {
		expect(courseRiskStatus(0)).toBe('OK');
		expect(courseRiskStatus(50)).toBe('OK');
		expect(courseRiskStatus(75)).toBe('WARNING');
		expect(courseRiskStatus(84.9)).toBe('WARNING');
		expect(courseRiskStatus(85)).toBe('CRITICAL');
	});
});

describe('generateLastBusinessDays', () => {
	it('generates 60 ascending business days ending at DEMO_TODAY', () => {
		const days = generateLastBusinessDays();
		expect(days).toHaveLength(DEMO_ATTENDANCE_DAYS);
		expect(DEMO_ATTENDANCE_DAYS).toBe(60);
		expect(days[0]).toBe('2026-03-20');
		expect(days.at(-1)).toBe(DEMO_TODAY);
		expect([...days].sort()).toEqual(days);
	});

	it('skips weekends and national holidays', () => {
		const days = generateLastBusinessDays();
		for (const day of days) {
			const dow = new Date(`${day}T00:00:00.000Z`).getUTCDay();
			expect([1, 2, 3, 4, 5]).toContain(dow);
		}
		// 2026-05-25 (25 de mayo) is a Monday holiday and must be absent.
		expect(days).not.toContain('2026-05-25');
		// The declared institutional non-working day is skipped as well.
		expect(days).not.toContain(DEMO_INSTITUTIONAL_DAY);
		// Every previous business day falls inside the window.
		expect(days).toContain('2026-05-22');
		expect(days).toContain('2026-05-26');
	});
});

describe('mondayOfWeek + paginate', () => {
	it('anchors a date to its Monday', () => {
		expect(mondayOfWeek('2026-05-08').toISOString().slice(0, 10)).toBe(
			'2026-05-04',
		);
		expect(mondayOfWeek('2026-05-11').toISOString().slice(0, 10)).toBe(
			'2026-05-11',
		);
		expect(mondayOfWeek('2026-06-19').toISOString().slice(0, 10)).toBe(
			'2026-06-15',
		);
	});

	it('paginates with stable page clamping', () => {
		const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
		expect(paginate(items, 1, 10).items).toHaveLength(10);
		expect(paginate(items, 1, 10).totalPages).toBe(2);
		expect(paginate(items, 99, 10).page).toBe(2);
		expect(paginate(items, 0, 10).page).toBe(1);
		expect(paginate(items, 2, 10).items).toEqual([11, 12, 13]);
	});
});
