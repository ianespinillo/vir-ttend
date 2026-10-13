import {
	type WeekdayKey,
	addDaysToDateString,
	parseDateString,
	weekdayOfDateString,
} from '../../lib/date';
import type { MySubject } from './types';

/**
 * Pure rules for choosing the day of an attendance sheet. No React here so
 * they stay easy to reason about (and to test once mobile has a runner).
 * Dates are `YYYY-MM-DD` strings in the device's local calendar; they compare
 * correctly as plain strings.
 */

/** School days: attendance is never taken on weekends. */
export const SCHOOL_WEEKDAYS: ReadonlySet<WeekdayKey> = new Set<WeekdayKey>([
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
]);

/** How far back sheets reach when the school year start is unknown. */
export const FALLBACK_LOOKBACK_DAYS = 120;

// Upper bound for the day-by-day scan of `stepDate` (a bit over one year).
const MAX_STEP_SCAN_DAYS = 400;

export interface AttendanceDateRules {
	/** Today, the latest selectable date. */
	today: string;
	/** The earliest selectable date. */
	earliest: string;
	/** Weekdays with class; null means any school day (Monday to Friday). */
	classDays: ReadonlySet<WeekdayKey> | null;
}

export type DateRejection =
	| 'invalid'
	| 'future'
	| 'before-start'
	| 'weekend'
	| 'no-class-day';

/** `YYYY-MM-DD` part of an ISO date-time, null when it is not a valid date. */
const isoDatePart = (value: string | undefined): string | null => {
	const part = value?.slice(0, 10);
	return part && parseDateString(part) ? part : null;
};

/**
 * Earliest selectable date: the start of the active school year, or about 120
 * days back when it is unknown. Never later than today.
 */
export const resolveEarliestDate = (input: {
	today: string;
	/** ISO date or date-time of the school year start, when known. */
	yearStart?: string;
}): string => {
	const start = isoDatePart(input.yearStart);
	if (!start) return addDaysToDateString(input.today, -FALLBACK_LOOKBACK_DAYS);
	return start > input.today ? input.today : start;
};

/** Why `date` cannot be selected, or null when it can. */
export const checkDate = (
	date: string,
	rules: AttendanceDateRules,
): DateRejection | null => {
	const weekday = weekdayOfDateString(date);
	if (!weekday) return 'invalid';
	if (date > rules.today) return 'future';
	if (date < rules.earliest) return 'before-start';
	if (!SCHOOL_WEEKDAYS.has(weekday)) return 'weekend';
	if (rules.classDays && !rules.classDays.has(weekday)) return 'no-class-day';
	return null;
};

/**
 * Previous (-1) or next (1) selectable date relative to `date`, skipping
 * weekends and, for subjects, days without class. Null when there is none
 * inside the allowed range.
 */
export const stepDate = (
	date: string,
	direction: -1 | 1,
	rules: AttendanceDateRules,
): string | null => {
	let candidate = date;
	for (let i = 0; i < MAX_STEP_SCAN_DAYS; i++) {
		candidate = addDaysToDateString(candidate, direction);
		if (candidate > rules.today || candidate < rules.earliest) return null;
		if (checkDate(candidate, rules) === null) return candidate;
	}
	return null;
};

/** The requested date when it is selectable, otherwise today. */
export const resolveInitialDate = (
	requested: string | undefined,
	rules: AttendanceDateRules,
): string =>
	requested && checkDate(requested, rules) === null ? requested : rules.today;

/** Weekdays a subject meets on, or null while its schedule is unknown. */
export const classDaysOfSubject = (
	subject: MySubject | undefined,
): ReadonlySet<WeekdayKey> | null =>
	subject ? new Set<WeekdayKey>(subject.slots.map((s) => s.dayOfWeek)) : null;

/** Short Spanish explanation shown when a date cannot be selected. */
export const describeRejection = (reason: DateRejection): string => {
	switch (reason) {
		case 'future':
			return 'No se puede tomar asistencia de una fecha futura.';
		case 'before-start':
			return 'Esa fecha es anterior al inicio del ciclo lectivo.';
		case 'weekend':
			return 'Los sábados y domingos no son días de clase.';
		case 'no-class-day':
			return 'Esta materia no tiene clase ese día.';
		default:
			return 'La fecha elegida no es válida.';
	}
};

export type DayDataState = 'ready' | 'loading' | 'offline-empty' | 'error';

/**
 * Whether the sheet may show its roster for the chosen day.
 *
 * Today is never blocked: attendance is taken offline-first, so the roster
 * shows (defaulting to present) even when the day's records are not cached.
 * A past day without cached records must not be edited blind: saving defaults
 * over records the device has not seen would overwrite them.
 */
export const resolveDayDataState = (input: {
	isToday: boolean;
	/** The day's records are in the cache. */
	hasData: boolean;
	/** The day has a queued local save. */
	hasOutboxItem: boolean;
	/** The day's query is fetching with nothing cached yet. */
	isLoading: boolean;
	/** The day's query is paused (offline). */
	isPaused: boolean;
	isError: boolean;
}): DayDataState => {
	if (input.hasData || input.hasOutboxItem || input.isToday) return 'ready';
	if (input.isLoading) return 'loading';
	if (input.isPaused) return 'offline-empty';
	if (input.isError) return 'error';
	return 'loading';
};
