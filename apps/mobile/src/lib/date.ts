export type WeekdayKey =
	| 'sunday'
	| 'monday'
	| 'tuesday'
	| 'wednesday'
	| 'thursday'
	| 'friday'
	| 'saturday';

// Indexed by `Date#getDay()`.
const WEEKDAYS: readonly WeekdayKey[] = [
	'sunday',
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
];

export const pad2 = (value: number): string => String(value).padStart(2, '0');

/** `YYYY-MM-DD` in the device's local time (never UTC). */
export const toLocalDateString = (date: Date = new Date()): string =>
	`${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

/** Weekday of a date in the device's local time. */
export const weekdayOf = (date: Date = new Date()): WeekdayKey =>
	WEEKDAYS[date.getDay()];

/**
 * Parses a `YYYY-MM-DD` string into a local Date at noon (noon keeps the
 * calendar day stable across DST shifts). Returns null for malformed input or
 * dates that do not exist (e.g. `2026-02-31`).
 */
export const parseDateString = (value: string): Date | null => {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!match) return null;
	const [, year, month, day] = match;
	const date = new Date(Number(year), Number(month) - 1, Number(day), 12);
	if (
		date.getFullYear() !== Number(year) ||
		date.getMonth() !== Number(month) - 1 ||
		date.getDate() !== Number(day)
	) {
		return null;
	}
	return date;
};

/**
 * Weekday of a `YYYY-MM-DD` string, computed from its calendar parts so the
 * device timezone can never shift the day. Returns null for malformed input.
 */
export const weekdayOfDateString = (value: string): WeekdayKey | null => {
	const date = parseDateString(value);
	return date ? weekdayOf(date) : null;
};

/** Adds (or subtracts) calendar days to a `YYYY-MM-DD` string. */
export const addDaysToDateString = (value: string, days: number): string => {
	const date = parseDateString(value);
	if (!date) return value;
	date.setDate(date.getDate() + days);
	return toLocalDateString(date);
};

const SHORT_WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** `Lun 06/10` for a `YYYY-MM-DD` string; the input itself when malformed. */
export const formatShortDate = (value: string): string => {
	const date = parseDateString(value);
	if (!date) return value;
	return `${SHORT_WEEKDAY_LABELS[date.getDay()]} ${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;
};

/** `dd/MM HH:mm` in the device's local time, e.g. `10/10 14:32`. */
export const formatDayMonthTime = (timestamp: number): string => {
	const date = new Date(timestamp);
	return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};
