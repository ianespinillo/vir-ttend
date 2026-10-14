import { ATTENDANCE_STATUS } from '@repo/common';

/**
 * Institutional absence counting per PBA Res. 1650/2024, Anexo 4 (section 8):
 * a school day never weighs more than 1 and, with a contraturno (workshop)
 * shift, each shift weighs 1/2. Justified absences still count (section 24).
 * Named so they can move to an institution setting later.
 */
export const DAILY_ABSENT_WEIGHT = 1;
export const CONTRATURNO_SHIFT_WEIGHT = 0.5;
export const LATE_WEIGHT = 0.25;
export const LATE_BEYOND_TOLERANCE_WEIGHT = 0.5;
export const MAX_DAILY_ABSENCE = 1;
/** Institutional cap of absences per school year (section 7). */
export const INSTITUTIONAL_ABSENCE_CAP = 28;

export interface WeightedAttendanceRecord {
	status: string;
	/** `Date` or a `YYYY-MM-DD` string, as the date column can hydrate either. */
	date: Date | string;
}

export interface WeightedAbsenceInput {
	/** Daily records only (no subject attendance rows). */
	dailyRecords: readonly WeightedAttendanceRecord[];
	workshopRecords: readonly WeightedAttendanceRecord[];
}

export interface WeightedAbsenceBreakdown {
	/** Part of the total coming from the daily (theory) shift. */
	daily: number;
	/** Part of the total coming from the workshop shift, after the day cap. */
	workshop: number;
}

export interface WeightedAbsenceResult {
	total: number;
	breakdown: WeightedAbsenceBreakdown;
}

/**
 * Calendar day (`YYYY-MM-DD`) of a `date` column value. Both daily and workshop
 * records come from `date` columns: a string is already the day and a `Date` is
 * UTC midnight (`new Date('YYYY-MM-DD')`), so the day is read in UTC and never
 * depends on the server timezone.
 */
export function toDateKey(date: Date | string): string {
	return typeof date === 'string'
		? date.slice(0, 10)
		: date.toISOString().slice(0, 10);
}

/** Weight of one record; `absentWeight` applies to absent and justified. */
function weightOf(status: string, absentWeight: number): number {
	switch (status) {
		case ATTENDANCE_STATUS.ABSENT:
		case ATTENDANCE_STATUS.JUSTIFIED:
			return absentWeight;
		case ATTENDANCE_STATUS.LATE:
			return LATE_WEIGHT;
		case ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE:
			return LATE_BEYOND_TOLERANCE_WEIGHT;
		default:
			return 0;
	}
}

function sumByDay(
	records: readonly WeightedAttendanceRecord[],
	absentWeightOf: (day: string) => number,
): Map<string, number> {
	const byDay = new Map<string, number>();
	for (const record of records) {
		const day = toDateKey(record.date);
		byDay.set(
			day,
			(byDay.get(day) ?? 0) + weightOf(record.status, absentWeightOf(day)),
		);
	}
	return byDay;
}

/**
 * Weighted absence total of one student. A date is a contraturno day only when
 * the workshop was held, that is, the student has a workshop record on it; there
 * a daily absence weighs 1/2. With no workshop record (not held, or not
 * scheduled) the student had a single shift and a daily absence weighs 1. Each
 * date is capped at 1, the daily shift being counted first.
 */
export function calculateWeightedAbsences(
	input: WeightedAbsenceInput,
): WeightedAbsenceResult {
	const contraturnoDays = new Set(
		input.workshopRecords.map((record) => toDateKey(record.date)),
	);

	const dailyByDay = sumByDay(input.dailyRecords, (day) =>
		contraturnoDays.has(day) ? CONTRATURNO_SHIFT_WEIGHT : DAILY_ABSENT_WEIGHT,
	);
	const workshopByDay = sumByDay(
		input.workshopRecords,
		() => CONTRATURNO_SHIFT_WEIGHT,
	);

	let daily = 0;
	let workshop = 0;
	for (const day of new Set([...dailyByDay.keys(), ...workshopByDay.keys()])) {
		const dailyWeight = Math.min(dailyByDay.get(day) ?? 0, MAX_DAILY_ABSENCE);
		daily += dailyWeight;
		workshop += Math.min(
			workshopByDay.get(day) ?? 0,
			MAX_DAILY_ABSENCE - dailyWeight,
		);
	}
	return { total: daily + workshop, breakdown: { daily, workshop } };
}
