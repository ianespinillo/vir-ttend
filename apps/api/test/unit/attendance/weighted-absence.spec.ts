import { ATTENDANCE_STATUS } from '@repo/common';
import {
	CONTRATURNO_SHIFT_WEIGHT,
	DAILY_ABSENT_WEIGHT,
	LATE_BEYOND_TOLERANCE_WEIGHT,
	LATE_WEIGHT,
	MAX_DAILY_ABSENCE,
	WeightedAbsenceInput,
	calculateWeightedAbsences,
} from '../../../src/modules/attendance/domain/services/weighted-absence';

const MONDAY = '2026-03-09';
const TUESDAY = '2026-03-10';

const run = (input: Partial<WeightedAbsenceInput>) =>
	calculateWeightedAbsences({
		dailyRecords: [],
		workshopRecords: [],
		scheduledWorkshopDates: [],
		...input,
	});

const daily = (status: string, date: Date | string = MONDAY) => ({
	status,
	date,
});

describe('calculateWeightedAbsences', () => {
	it('exposes the weights of the norm', () => {
		expect(DAILY_ABSENT_WEIGHT).toBe(1);
		expect(CONTRATURNO_SHIFT_WEIGHT).toBe(0.5);
		expect(LATE_WEIGHT).toBe(0.25);
		expect(LATE_BEYOND_TOLERANCE_WEIGHT).toBe(0.5);
		expect(MAX_DAILY_ABSENCE).toBe(1);
	});

	describe('regular day (no contraturno)', () => {
		it.each([
			[ATTENDANCE_STATUS.PRESENT, 0],
			[ATTENDANCE_STATUS.ABSENT, 1],
			[ATTENDANCE_STATUS.JUSTIFIED, 1],
			[ATTENDANCE_STATUS.LATE, 0.25],
			[ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE, 0.5],
		])('daily %s weighs %d', (status, weight) => {
			expect(run({ dailyRecords: [daily(status)] }).total).toBe(weight);
		});

		it('weighs an unknown status as 0', () => {
			expect(run({ dailyRecords: [daily('mystery')] }).total).toBe(0);
		});

		it('adds up different days', () => {
			const result = run({
				dailyRecords: [
					daily(ATTENDANCE_STATUS.ABSENT, MONDAY),
					daily(ATTENDANCE_STATUS.LATE, TUESDAY),
				],
			});
			expect(result.total).toBe(1.25);
			expect(result.breakdown).toEqual({ daily: 1.25, workshop: 0 });
		});
	});

	describe('contraturno day', () => {
		it('halves the daily absence on a scheduled workshop day', () => {
			const result = run({
				dailyRecords: [daily(ATTENDANCE_STATUS.ABSENT)],
				scheduledWorkshopDates: [MONDAY],
			});
			expect(result.total).toBe(0.5);
		});

		it('halves a justified daily absence too', () => {
			const result = run({
				dailyRecords: [daily(ATTENDANCE_STATUS.JUSTIFIED)],
				scheduledWorkshopDates: [MONDAY],
			});
			expect(result.total).toBe(0.5);
		});

		it('does not halve a late arrival', () => {
			const result = run({
				dailyRecords: [
					daily(ATTENDANCE_STATUS.LATE, MONDAY),
					daily(ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE, TUESDAY),
				],
				scheduledWorkshopDates: [MONDAY, TUESDAY],
			});
			expect(result.total).toBe(0.75);
		});

		it('is a contraturno day when the student has a workshop record, even unscheduled', () => {
			const result = run({
				dailyRecords: [daily(ATTENDANCE_STATUS.ABSENT)],
				workshopRecords: [daily(ATTENDANCE_STATUS.PRESENT)],
			});
			expect(result.total).toBe(0.5);
		});

		it('matches Date and string spellings of the same calendar day', () => {
			const result = run({
				dailyRecords: [daily(ATTENDANCE_STATUS.ABSENT, new Date(MONDAY))],
				scheduledWorkshopDates: [new Date(`${MONDAY}T00:00:00.000Z`)],
			});
			expect(result.total).toBe(0.5);
		});
	});

	describe('workshop records', () => {
		it.each([
			[ATTENDANCE_STATUS.PRESENT, 0],
			[ATTENDANCE_STATUS.ABSENT, 0.5],
			[ATTENDANCE_STATUS.JUSTIFIED, 0.5],
			[ATTENDANCE_STATUS.LATE, 0.25],
			[ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE, 0.5],
		])('workshop %s weighs %d', (status, weight) => {
			const result = run({ workshopRecords: [daily(status)] });
			expect(result.total).toBe(weight);
			expect(result.breakdown).toEqual({ daily: 0, workshop: weight });
		});

		it('a full-day absence on a workshop day weighs exactly 1', () => {
			const result = run({
				dailyRecords: [daily(ATTENDANCE_STATUS.ABSENT)],
				workshopRecords: [daily(ATTENDANCE_STATUS.ABSENT)],
				scheduledWorkshopDates: [MONDAY],
			});
			expect(result.total).toBe(1);
			expect(result.breakdown).toEqual({ daily: 0.5, workshop: 0.5 });
		});
	});

	describe('per-day cap', () => {
		it('never exceeds 1 with several daily records and a workshop absence', () => {
			const result = run({
				dailyRecords: [
					daily(ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE),
					daily(ATTENDANCE_STATUS.ABSENT),
				],
				workshopRecords: [daily(ATTENDANCE_STATUS.ABSENT)],
			});
			expect(result.total).toBe(1);
			expect(result.breakdown).toEqual({ daily: 1, workshop: 0 });
		});

		it('caps a day whose records exceed 1 and keeps other days intact', () => {
			const result = run({
				dailyRecords: [
					daily(ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE, MONDAY),
					daily(ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE, MONDAY),
					daily(ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE, MONDAY),
					daily(ATTENDANCE_STATUS.ABSENT, TUESDAY),
				],
			});
			expect(result.total).toBe(2);
		});

		it('adds the workshop part only up to what the daily part leaves', () => {
			const result = run({
				dailyRecords: [daily(ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE)],
				workshopRecords: [daily(ATTENDANCE_STATUS.ABSENT)],
				scheduledWorkshopDates: [MONDAY],
			});
			expect(result.total).toBe(1);
		});
	});

	describe('student without a workshop', () => {
		it('counts daily absences in full and has no workshop part', () => {
			const result = run({
				dailyRecords: [
					daily(ATTENDANCE_STATUS.ABSENT, MONDAY),
					daily(ATTENDANCE_STATUS.ABSENT, TUESDAY),
				],
			});
			expect(result.total).toBe(2);
			expect(result.breakdown.workshop).toBe(0);
		});

		it('is zero without records', () => {
			expect(run({}).total).toBe(0);
		});
	});
});
