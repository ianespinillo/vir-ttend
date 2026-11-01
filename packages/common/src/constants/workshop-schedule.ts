import { DAYOFWEEK } from './day-of-week.enum.js';
import {
	type CommissionNumber,
	SUBJECT_KIND,
	type SubjectKindType,
} from './subject-kind.enum.js';

/** The part of a schedule slot needed to know on which days a workshop runs. */
export interface WorkshopSlotInput {
	subjectId: string;
	dayOfWeek: DAYOFWEEK;
	/** 1 | 2 for a single workshop commission; null/absent = the whole course. */
	commissionNumber?: CommissionNumber | null;
}

/** The part of a subject needed to tell workshop slots from theory ones. */
export interface WorkshopSubjectInput {
	id: string;
	/** Absent = theory, as in the API payload. */
	kind?: SubjectKindType;
}

/**
 * What the schedule says about the workshop of a commission on a given day:
 * - `scheduled`: the commission has a workshop that weekday.
 * - `unscheduled`: it has workshop slots, but none that weekday.
 * - `no-schedule`: it has no workshop slot at all, so the days are unknown.
 */
export type WorkshopAvailability = 'scheduled' | 'unscheduled' | 'no-schedule';

const WEEKDAY_BY_UTC_INDEX: Partial<Record<number, DAYOFWEEK>> = {
	1: DAYOFWEEK.MONDAY,
	2: DAYOFWEEK.TUESDAY,
	3: DAYOFWEEK.WEDNESDAY,
	4: DAYOFWEEK.THURSDAY,
	5: DAYOFWEEK.FRIDAY,
};

/**
 * Weekday of a `YYYY-MM-DD` class date, read from its calendar parts (UTC
 * midnight, like the API), so the device timezone never shifts the day.
 * Weekends have no school day and, like malformed input, return `undefined`.
 */
export function schoolWeekdayOf(date: string): DAYOFWEEK | undefined {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
	if (!match) return undefined;
	const [, year, month, day] = match;
	const parsed = new Date(
		Date.UTC(Number(year), Number(month) - 1, Number(day)),
	);
	if (
		parsed.getUTCFullYear() !== Number(year) ||
		parsed.getUTCMonth() !== Number(month) - 1 ||
		parsed.getUTCDate() !== Number(day)
	) {
		return undefined;
	}
	return WEEKDAY_BY_UTC_INDEX[parsed.getUTCDay()];
}

/**
 * Weekdays on which the commission has a workshop: slots of workshop subjects
 * that are for the whole course or for this commission. Mirrors the API rule
 * behind `hasWorkshopToday`.
 */
export function workshopDaysOf(
	slots: readonly WorkshopSlotInput[],
	subjects: readonly WorkshopSubjectInput[],
	commissionNumber: CommissionNumber | number,
): DAYOFWEEK[] {
	const workshopSubjectIds = new Set(
		subjects
			.filter((subject) => subject.kind === SUBJECT_KIND.WORKSHOP)
			.map((subject) => subject.id),
	);
	const days = slots
		.filter(
			(slot) =>
				workshopSubjectIds.has(slot.subjectId) &&
				(slot.commissionNumber == null ||
					slot.commissionNumber === commissionNumber),
		)
		.map((slot) => slot.dayOfWeek);
	return [...new Set(days)];
}

/** Whether the commission has a workshop on the weekday of `date`. */
export function hasWorkshopOn(
	workshopDays: readonly DAYOFWEEK[],
	date: string,
): boolean {
	const weekday = schoolWeekdayOf(date);
	return weekday !== undefined && workshopDays.includes(weekday);
}

/** Workshop availability of a commission on `date` from its workshop days. */
export function workshopAvailabilityOn(
	workshopDays: readonly DAYOFWEEK[],
	date: string,
): WorkshopAvailability {
	if (workshopDays.length === 0) return 'no-schedule';
	return hasWorkshopOn(workshopDays, date) ? 'scheduled' : 'unscheduled';
}
