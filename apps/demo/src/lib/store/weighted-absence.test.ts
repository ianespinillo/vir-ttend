import { describe, expect, it } from 'vitest';
import {
	absenceCountToReportStatus,
	absencePercentOver,
	calculateWeightedAbsences,
	checkThreshold,
	countDaysGiven,
} from './weighted-absence';

const rec = (date: string, status: string) => ({ date, status });

describe('calculateWeightedAbsences', () => {
	it('weighs absent/justified 1, late 0.25 and late beyond tolerance 0.5', () => {
		const result = calculateWeightedAbsences({
			dailyRecords: [
				rec('2026-06-01', 'absent'),
				rec('2026-06-02', 'justified'),
				rec('2026-06-03', 'late'),
				rec('2026-06-04', 'late_beyond_tolerance'),
				rec('2026-06-05', 'present'),
			],
			workshopRecords: [],
		});
		expect(result.total).toBe(2.75);
		expect(result.breakdown).toEqual({ daily: 2.75, workshop: 0 });
	});

	it('halves each shift on a contraturno day and caps the day at 1', () => {
		const result = calculateWeightedAbsences({
			dailyRecords: [
				rec('2026-06-02', 'absent'), // workshop day: 1/2
				rec('2026-06-03', 'absent'), // single shift: 1
			],
			workshopRecords: [
				rec('2026-06-02', 'absent'), // 1/2 -> the day adds up to 1
				rec('2026-06-04', 'absent'), // workshop only: 1/2
			],
		});
		expect(result.total).toBe(2.5);
		expect(result.breakdown).toEqual({ daily: 1.5, workshop: 1 });
	});

	it('never weighs a school day more than 1', () => {
		const result = calculateWeightedAbsences({
			dailyRecords: [rec('2026-06-02', 'absent')],
			workshopRecords: [rec('2026-06-02', 'absent'), rec('2026-06-02', 'late')],
		});
		expect(result.total).toBe(1);
	});

	it('weighs a workshop absence 1 in a workshop-only course', () => {
		const result = calculateWeightedAbsences({
			dailyRecords: [],
			workshopRecords: [rec('2026-06-02', 'absent'), rec('2026-06-03', 'absent')],
			workshopOnly: true,
		});
		expect(result.total).toBe(2);
		expect(result.breakdown).toEqual({ daily: 0, workshop: 2 });
	});
});

describe('days given and percent', () => {
	it('counts distinct dates with a daily or workshop record', () => {
		expect(
			countDaysGiven(
				[rec('2026-06-02', 'present'), rec('2026-06-03', 'present')],
				[rec('2026-06-02', 'present'), rec('2026-06-04', 'present')],
			),
		).toBe(3);
	});

	it('is null when no class was given', () => {
		expect(absencePercentOver(0, 0)).toBeNull();
		expect(absencePercentOver(5, 20)).toBe(25);
	});
});

describe('checkThreshold', () => {
	it('raises warning at 10, critical at 20 and exceeded at the cap', () => {
		const none = new Set<never>();
		expect(checkThreshold(9.75, none)).toBeNull();
		expect(checkThreshold(10, none)).toEqual({
			threshold: 10,
			alertType: 'warning',
		});
		expect(checkThreshold(20, none)).toEqual({
			threshold: 20,
			alertType: 'critical',
		});
		expect(checkThreshold(28, none)).toEqual({
			threshold: 28,
			alertType: 'exceeded',
		});
	});

	it('raises only the highest threshold reached, once per type', () => {
		expect(checkThreshold(21, new Set())?.alertType).toBe('critical');
		expect(checkThreshold(21, new Set(['critical']))).toBeNull();
		expect(checkThreshold(12, new Set(['warning']))).toBeNull();
	});
});

describe('absenceCountToReportStatus', () => {
	it('maps the count to ok / at-risk / exceeded', () => {
		expect(absenceCountToReportStatus(9.75)).toBe('ok');
		expect(absenceCountToReportStatus(10)).toBe('at-risk');
		expect(absenceCountToReportStatus(27.5)).toBe('at-risk');
		expect(absenceCountToReportStatus(28)).toBe('exceeded');
	});
});
