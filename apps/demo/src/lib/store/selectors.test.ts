import { describe, expect, it } from 'vitest';
import {
	absencePercent,
	absenceToAlertType,
	absenceToReportStatus,
	courseRiskStatus,
	effectiveAbsenceCount,
	generateLastBusinessDays,
	mondayOfWeek,
	paginate,
} from './selectors';
import { DEMO_ATTENDANCE_DAYS, DEMO_TODAY } from './types';

describe('math helpers (single source of truth)', () => {
	it('converts 3 tardanzas into 1 inasistencia', () => {
		expect(effectiveAbsenceCount(0, 3)).toBe(1);
		expect(effectiveAbsenceCount(4, 6)).toBe(6);
		expect(effectiveAbsenceCount(4, 0)).toBe(4);
	});

	it('computes rounded absence percent', () => {
		expect(absencePercent(4, 0, 35)).toBe(11.4);
		expect(absencePercent(6, 0, 35)).toBe(17.1);
		expect(absencePercent(4, 0, 30)).toBe(13.3);
		expect(absencePercent(0, 0, 0)).toBe(0);
	});

	it('maps absence percent to alert bands (10 / 15)', () => {
		expect(absenceToAlertType(9.9)).toBeNull();
		expect(absenceToAlertType(10)).toBe('warning');
		expect(absenceToAlertType(14.9)).toBe('warning');
		expect(absenceToAlertType(15)).toBe('critical');
		expect(absenceToAlertType(20)).toBe('critical');
	});

	it('maps absence percent to report status', () => {
		expect(absenceToReportStatus(9.9)).toBe('ok');
		expect(absenceToReportStatus(12)).toBe('at-risk');
		expect(absenceToReportStatus(15)).toBe('exceeded');
		expect(absenceToReportStatus(50)).toBe('exceeded');
	});

	it('maps course risk with product thresholds (75 / 85)', () => {
		expect(courseRiskStatus(0)).toBe('OK');
		expect(courseRiskStatus(50)).toBe('OK');
		expect(courseRiskStatus(75)).toBe('WARNING');
		expect(courseRiskStatus(84.9)).toBe('WARNING');
		expect(courseRiskStatus(85)).toBe('CRITICAL');
	});
});

describe('generateLastBusinessDays', () => {
	it('generates 30 ascending business days ending at DEMO_TODAY', () => {
		const days = generateLastBusinessDays();
		expect(days).toHaveLength(DEMO_ATTENDANCE_DAYS);
		expect(days[0]).toBe('2026-05-08');
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
