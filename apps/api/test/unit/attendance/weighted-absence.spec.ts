import { ATTENDANCE_STATUS } from '@repo/common';
import {
	CONTRATURNO_SHIFT_WEIGHT,
	DAILY_ABSENT_WEIGHT,
	LATE_BEYOND_TOLERANCE_WEIGHT,
	LATE_WEIGHT,
	MAX_DAILY_ABSENCE,
	WeightedAbsenceInput,
	calculateWeightedAbsences,
	calculateWeightedAbsencesByStudent,
	countDaysGiven,
	toDateKey,
} from '../../../src/modules/attendance/domain/services/weighted-absence';

const MONDAY = '2026-03-09';
const TUESDAY = '2026-03-10';

const run = (input: Partial<WeightedAbsenceInput>) =>
	calculateWeightedAbsences({
		dailyRecords: [],
		workshopRecords: [],
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

	describe('contraturno day (workshop held)', () => {
		it('halves the daily absence on a day with a workshop record', () => {
			const result = run({
				dailyRecords: [daily(ATTENDANCE_STATUS.ABSENT)],
				workshopRecords: [daily(ATTENDANCE_STATUS.PRESENT)],
			});
			expect(result.total).toBe(0.5);
		});

		it('halves a justified daily absence too', () => {
			const result = run({
				dailyRecords: [daily(ATTENDANCE_STATUS.JUSTIFIED)],
				workshopRecords: [daily(ATTENDANCE_STATUS.PRESENT)],
			});
			expect(result.total).toBe(0.5);
		});

		it('weighs a daily absence 1 when the workshop was not held (no record)', () => {
			const result = run({
				dailyRecords: [daily(ATTENDANCE_STATUS.ABSENT, MONDAY)],
				workshopRecords: [daily(ATTENDANCE_STATUS.PRESENT, TUESDAY)],
			});
			// Monday has no workshop record, so it is a single-shift day.
			expect(result.total).toBe(1);
		});

		it('halves a daily absence on an expected contraturno day with no record yet', () => {
			const result = run({
				dailyRecords: [daily(ATTENDANCE_STATUS.ABSENT, MONDAY)],
				workshopRecords: [],
				expectedContraturnoDays: [MONDAY],
			});
			expect(result.total).toBe(0.5);
		});

		it('only affects the listed day', () => {
			const result = run({
				dailyRecords: [
					daily(ATTENDANCE_STATUS.ABSENT, MONDAY),
					daily(ATTENDANCE_STATUS.ABSENT, TUESDAY),
				],
				workshopRecords: [],
				expectedContraturnoDays: [MONDAY],
			});
			expect(result.total).toBe(1.5);
		});

		it('does not halve a late arrival', () => {
			const result = run({
				dailyRecords: [
					daily(ATTENDANCE_STATUS.LATE, MONDAY),
					daily(ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE, TUESDAY),
				],
				workshopRecords: [
					daily(ATTENDANCE_STATUS.PRESENT, MONDAY),
					daily(ATTENDANCE_STATUS.PRESENT, TUESDAY),
				],
			});
			expect(result.total).toBe(0.75);
		});

		it('matches Date and string spellings of the same calendar day', () => {
			const result = run({
				dailyRecords: [daily(ATTENDANCE_STATUS.ABSENT, new Date(MONDAY))],
				workshopRecords: [
					daily(ATTENDANCE_STATUS.PRESENT, `${MONDAY}T00:00:00.000Z`),
				],
			});
			expect(result.total).toBe(0.5);
		});

		it('shares one key between a daily and a workshop record of the same day, whatever the spelling', () => {
			// Local midnight of a UTC-3 server, built explicitly (an absolute instant).
			const localMidnightUtcMinus3 = new Date(`${MONDAY}T00:00:00-03:00`);
			expect(toDateKey(localMidnightUtcMinus3)).toBe(MONDAY);
			expect(toDateKey(new Date(MONDAY))).toBe(MONDAY);
			expect(toDateKey(MONDAY)).toBe(MONDAY);

			const result = run({
				dailyRecords: [daily(ATTENDANCE_STATUS.ABSENT, MONDAY)],
				workshopRecords: [daily(ATTENDANCE_STATUS.PRESENT, localMidnightUtcMinus3)],
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
			});
			expect(result.total).toBe(1);
			expect(result.breakdown).toEqual({ daily: 0.5, workshop: 0.5 });
		});
	});

	describe('theory not held', () => {
		it.each([
			[ATTENDANCE_STATUS.ABSENT, DAILY_ABSENT_WEIGHT],
			[ATTENDANCE_STATUS.JUSTIFIED, DAILY_ABSENT_WEIGHT],
			[ATTENDANCE_STATUS.LATE, LATE_WEIGHT],
			[ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE, LATE_BEYOND_TOLERANCE_WEIGHT],
		])('workshop %s weighs %d when theory was not held', (status, weight) => {
			const result = run({
				workshopRecords: [daily(status)],
				theoryNotHeldDays: [MONDAY],
			});
			expect(result.total).toBe(weight);
			expect(result.breakdown).toEqual({ daily: 0, workshop: weight });
		});

		it('keeps the 1/2 weight of a workshop absence when theory was held', () => {
			const result = run({
				workshopRecords: [daily(ATTENDANCE_STATUS.ABSENT)],
				theoryNotHeldDays: [TUESDAY],
			});
			expect(result.total).toBe(CONTRATURNO_SHIFT_WEIGHT);
		});

		it('only affects the listed day', () => {
			const result = run({
				workshopRecords: [
					daily(ATTENDANCE_STATUS.ABSENT, MONDAY),
					daily(ATTENDANCE_STATUS.ABSENT, TUESDAY),
				],
				theoryNotHeldDays: [MONDAY],
			});
			expect(result.total).toBe(1.5);
		});

		it('never exceeds the per-day cap', () => {
			const result = run({
				dailyRecords: [daily(ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE)],
				workshopRecords: [daily(ATTENDANCE_STATUS.ABSENT)],
				theoryNotHeldDays: [MONDAY],
			});
			expect(result.total).toBe(MAX_DAILY_ABSENCE);
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

describe('countDaysGiven', () => {
	it('counts each date once, whether it has a daily record, a workshop record or both', () => {
		expect(
			countDaysGiven(
				[daily(ATTENDANCE_STATUS.PRESENT, MONDAY), daily('absent', TUESDAY)],
				[
					daily(ATTENDANCE_STATUS.PRESENT, MONDAY),
					daily(ATTENDANCE_STATUS.PRESENT, '2026-03-11'),
				],
			),
		).toBe(3);
	});

	it('reads a Date at UTC midnight and a YYYY-MM-DD string as the same day', () => {
		expect(
			countDaysGiven(
				[daily(ATTENDANCE_STATUS.PRESENT, new Date(`${MONDAY}T00:00:00.000Z`))],
				[daily(ATTENDANCE_STATUS.PRESENT, MONDAY)],
			),
		).toBe(1);
	});

	it('is zero without records', () => {
		expect(countDaysGiven([], [])).toBe(0);
	});
});

describe('calculateWeightedAbsencesByStudent', () => {
	const rec = (studentId: string, status: string, date = MONDAY) => ({
		studentId,
		status,
		date,
	});

	it('weighs every student of a course-wide read apart, with the days given', () => {
		const result = calculateWeightedAbsencesByStudent(
			[
				rec('ana', ATTENDANCE_STATUS.ABSENT),
				rec('ana', ATTENDANCE_STATUS.PRESENT, TUESDAY),
				rec('beto', ATTENDANCE_STATUS.ABSENT),
				rec('beto', ATTENDANCE_STATUS.LATE, TUESDAY),
			],
			[rec('beto', ATTENDANCE_STATUS.ABSENT)],
		);

		// Ana has no workshop record on Monday: the daily absence weighs 1.
		expect(result.get('ana')).toEqual({
			total: 1,
			breakdown: { daily: 1, workshop: 0 },
			daysGiven: 2,
		});
		// Beto: Monday 0.5 + 0.5 (workshop day), Tuesday 0.25.
		expect(result.get('beto')).toEqual({
			total: 1.25,
			breakdown: { daily: 0.75, workshop: 0.5 },
			daysGiven: 2,
		});
	});

	it('includes a student that only has workshop records', () => {
		const result = calculateWeightedAbsencesByStudent(
			[],
			[rec('carla', ATTENDANCE_STATUS.ABSENT)],
		);
		expect(result.get('carla')).toEqual({
			total: 0.5,
			breakdown: { daily: 0, workshop: 0.5 },
			daysGiven: 1,
		});
	});

	it('forwards the course-wide theory-not-held dates to every student', () => {
		const result = calculateWeightedAbsencesByStudent(
			[],
			[
				rec('ana', ATTENDANCE_STATUS.ABSENT, MONDAY),
				rec('ana', ATTENDANCE_STATUS.ABSENT, TUESDAY),
				rec('beto', ATTENDANCE_STATUS.ABSENT, MONDAY),
			],
			{ theoryNotHeldDays: [MONDAY] },
		);
		expect(result.get('ana')?.total).toBe(1.5);
		expect(result.get('beto')?.total).toBe(1);
	});

	it('leaves out students without records', () => {
		expect(calculateWeightedAbsencesByStudent([], []).size).toBe(0);
	});
});

describe('workshop-only course (7th year technical)', () => {
	it.each([
		[ATTENDANCE_STATUS.PRESENT, 0],
		[ATTENDANCE_STATUS.ABSENT, 1],
		[ATTENDANCE_STATUS.JUSTIFIED, 1],
		[ATTENDANCE_STATUS.LATE, 0.25],
		[ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE, 0.5],
	])(
		'workshop %s weighs %d (single shift, no contraturno halving)',
		(status, weight) => {
			const result = run({ workshopRecords: [daily(status)], workshopOnly: true });
			expect(result.total).toBe(weight);
			expect(result.breakdown).toEqual({ daily: 0, workshop: weight });
		},
	);

	it('keeps a legacy daily absence at 1 even on a day with a workshop record', () => {
		const result = run({
			dailyRecords: [daily(ATTENDANCE_STATUS.ABSENT)],
			workshopRecords: [daily(ATTENDANCE_STATUS.PRESENT)],
			workshopOnly: true,
		});
		expect(result.total).toBe(1);
		expect(result.breakdown).toEqual({ daily: 1, workshop: 0 });
	});

	it('caps a day with a legacy daily absence and a workshop absence at 1', () => {
		const result = run({
			dailyRecords: [daily(ATTENDANCE_STATUS.ABSENT)],
			workshopRecords: [daily(ATTENDANCE_STATUS.ABSENT)],
			workshopOnly: true,
		});
		expect(result.total).toBe(MAX_DAILY_ABSENCE);
		expect(result.breakdown).toEqual({ daily: 1, workshop: 0 });
	});

	it('ignores expected contraturno days', () => {
		const result = run({
			dailyRecords: [daily(ATTENDANCE_STATUS.ABSENT)],
			expectedContraturnoDays: [MONDAY],
			workshopOnly: true,
		});
		expect(result.total).toBe(1);
	});

	it('is unchanged by theory-not-held days (already weighs 1)', () => {
		const result = run({
			workshopRecords: [daily(ATTENDANCE_STATUS.ABSENT)],
			theoryNotHeldDays: [MONDAY],
			workshopOnly: true,
		});
		expect(result.total).toBe(1);
	});

	it('leaves regular courses unchanged when the flag is false', () => {
		const result = run({
			workshopRecords: [daily(ATTENDANCE_STATUS.ABSENT)],
			workshopOnly: false,
		});
		expect(result.total).toBe(0.5);
	});

	it('applies to every student of a course-wide read', () => {
		const result = calculateWeightedAbsencesByStudent(
			[],
			[
				{ studentId: 'ana', status: ATTENDANCE_STATUS.ABSENT, date: MONDAY },
				{ studentId: 'ana', status: ATTENDANCE_STATUS.LATE, date: TUESDAY },
			],
			{ workshopOnly: true },
		);
		expect(result.get('ana')).toEqual({
			total: 1.25,
			breakdown: { daily: 0, workshop: 1.25 },
			daysGiven: 2,
		});
	});
});
