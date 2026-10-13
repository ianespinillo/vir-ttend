import { SHIFT, type ShiftType } from '@repo/common';

/**
 * Spanish labels for the course shift enum. The API exposes the raw value
 * (`MORNING` / `AFTERNOON` / `EVENING`) and even embeds it into formatted
 * course names, so the translation lives on the frontend only.
 */
export const SHIFT_LABELS: Record<ShiftType, string> = {
	[SHIFT.MORNING]: 'Mañana',
	[SHIFT.AFTERNOON]: 'Tarde',
	[SHIFT.EVENING]: 'Noche',
};

export function formatShift(shift?: ShiftType | string | null): string {
	if (!shift) return '';
	return SHIFT_LABELS[shift as ShiftType] ?? shift;
}

/**
 * The API builds course names like `"4° 2 - MORNING"` out of the raw shift
 * enum. Translate that embedded English token for display without changing
 * the API contract.
 */
export function localizeCourseName(name?: string | null): string {
	if (!name) return '';
	return name
		.replace(/\bMORNING\b/g, SHIFT_LABELS[SHIFT.MORNING])
		.replace(/\bAFTERNOON\b/g, SHIFT_LABELS[SHIFT.AFTERNOON])
		.replace(/\bEVENING\b/g, SHIFT_LABELS[SHIFT.EVENING]);
}
