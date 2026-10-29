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
	/**
	 * `YYYY-MM-DD` dates to treat as contraturno days although no workshop
	 * record exists yet (today, while the workshop has not been taken).
	 */
	expectedContraturnoDays?: readonly string[];
	/**
	 * `YYYY-MM-DD` dates on which the daily (theory) shift was not held for the
	 * student's course. On them the workshop was the only shift of the day, so a
	 * workshop absence weighs 1 instead of 1/2.
	 */
	theoryNotHeldDays?: readonly string[];
	/**
	 * Workshop-only course (7th year technical, see `isWorkshopOnlyCourse`):
	 * attendance is a single shift, so there is no contraturno halving. A
	 * workshop absence weighs 1 and legacy daily records keep their full weight.
	 */
	workshopOnly?: boolean;
}

export interface WeightedAbsenceOptions {
	workshopOnly?: boolean;
	/** Course-wide: the same theory-not-held dates apply to every student. */
	theoryNotHeldDays?: readonly string[];
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
 * scheduled) the student had a single shift and a daily absence weighs 1, unless
 * the caller lists the date in `expectedContraturnoDays`. Each
 * date is capped at 1, the daily shift being counted first. In a workshop-only
 * course (`workshopOnly`) every shift is the only one of the day: absences weigh
 * 1 whether daily (legacy) or workshop. On a date listed in `theoryNotHeldDays`
 * the daily shift was not held, so the workshop was the only shift of the day
 * and a workshop absence weighs 1 (justified too); lates keep their weight.
 */
export function calculateWeightedAbsences(
	input: WeightedAbsenceInput,
): WeightedAbsenceResult {
	const contraturnoDays = new Set(
		input.workshopOnly
			? []
			: [
					...input.workshopRecords.map((record) => toDateKey(record.date)),
					...(input.expectedContraturnoDays ?? []),
				],
	);
	const theoryNotHeld = new Set(input.theoryNotHeldDays ?? []);
	const workshopAbsentWeightOf = (day: string) =>
		input.workshopOnly || theoryNotHeld.has(day)
			? DAILY_ABSENT_WEIGHT
			: CONTRATURNO_SHIFT_WEIGHT;

	const dailyByDay = sumByDay(input.dailyRecords, (day) =>
		contraturnoDays.has(day) ? CONTRATURNO_SHIFT_WEIGHT : DAILY_ABSENT_WEIGHT,
	);
	const workshopByDay = sumByDay(input.workshopRecords, workshopAbsentWeightOf);

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

export interface WeightedStudentRecord extends WeightedAttendanceRecord {
	studentId: string;
}

export interface WeightedAbsenceSummary extends WeightedAbsenceResult {
	/**
	 * Distinct dates on which the student has a daily or workshop record: the
	 * classes effectively given, never the schedule. Each date counts once.
	 */
	daysGiven: number;
}

/** Days effectively given to a student: distinct dates with any record. */
export function countDaysGiven(
	dailyRecords: readonly WeightedAttendanceRecord[],
	workshopRecords: readonly WeightedAttendanceRecord[],
): number {
	return new Set(
		[...dailyRecords, ...workshopRecords].map((record) => toDateKey(record.date)),
	).size;
}

/**
 * Weighted totals of every student found in the (course-wide) records, from one
 * bulk read instead of a query per student. Students with no record are absent
 * from the result.
 */
export function calculateWeightedAbsencesByStudent(
	dailyRecords: readonly WeightedStudentRecord[],
	workshopRecords: readonly WeightedStudentRecord[],
	options: WeightedAbsenceOptions = {},
): Map<string, WeightedAbsenceSummary> {
	const byStudent = new Map<
		string,
		{ daily: WeightedStudentRecord[]; workshop: WeightedStudentRecord[] }
	>();
	const bucket = (studentId: string) => {
		let entry = byStudent.get(studentId);
		if (!entry) {
			entry = { daily: [], workshop: [] };
			byStudent.set(studentId, entry);
		}
		return entry;
	};
	for (const record of dailyRecords) bucket(record.studentId).daily.push(record);
	for (const record of workshopRecords)
		bucket(record.studentId).workshop.push(record);

	const result = new Map<string, WeightedAbsenceSummary>();
	for (const [studentId, { daily, workshop }] of byStudent) {
		result.set(studentId, {
			...calculateWeightedAbsences({
				dailyRecords: daily,
				workshopRecords: workshop,
				workshopOnly: options.workshopOnly,
				theoryNotHeldDays: options.theoryNotHeldDays,
			}),
			daysGiven: countDaysGiven(daily, workshop),
		});
	}
	return result;
}
