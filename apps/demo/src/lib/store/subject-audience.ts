/**
 * Demo store — subject audience.
 *
 * Replica of the API rule (attendance/domain/services/subject-audience.ts): who
 * a subject's roster is made of. A workshop subject whose slots target a single
 * commission only lists that commission's students; slots without commission
 * (or targeting both) list the whole course.
 */

import { type CommissionNumber, DAYOFWEEK } from '@repo/common';

export interface AudienceSlot {
	readonly dayOfWeek: DAYOFWEEK;
	/** Workshop commission the slot targets; null/undefined targets the whole course. */
	readonly commissionNumber?: CommissionNumber | null;
}

/** Either every student of the course, or the students of these commissions. */
export type SubjectAudience = 'whole-course' | CommissionNumber[];

const WEEKDAYS: Partial<Record<number, DAYOFWEEK>> = {
	1: DAYOFWEEK.MONDAY,
	2: DAYOFWEEK.TUESDAY,
	3: DAYOFWEEK.WEDNESDAY,
	4: DAYOFWEEK.THURSDAY,
	5: DAYOFWEEK.FRIDAY,
};

/** Class dates travel as `YYYY-MM-DD`: read the UTC weekday. */
export function weekdayOfIsoDate(isoDate: string): DAYOFWEEK | undefined {
	return WEEKDAYS[new Date(`${isoDate.slice(0, 10)}T00:00:00.000Z`).getUTCDay()];
}

/**
 * With a weekday, only that weekday's slots count (every slot if it has none);
 * no slots, or any counted slot targeting both commissions, means the whole
 * course; otherwise the targeted commissions.
 */
export function resolveSubjectAudience(
	slots: readonly AudienceSlot[],
	weekday?: DAYOFWEEK,
): SubjectAudience {
	const ofDay = weekday ? slots.filter((s) => s.dayOfWeek === weekday) : [];
	const counted = ofDay.length > 0 ? ofDay : slots;
	if (counted.length === 0) return 'whole-course';
	if (counted.some((slot) => slot.commissionNumber == null)) {
		return 'whole-course';
	}
	const numbers = new Set<CommissionNumber>();
	for (const slot of counted) {
		if (slot.commissionNumber != null) numbers.add(slot.commissionNumber);
	}
	return [...numbers].sort((a, b) => a - b);
}
