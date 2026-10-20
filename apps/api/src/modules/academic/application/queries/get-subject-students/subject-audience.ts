import { CommissionNumber, DAYOFWEEK } from '@repo/common';

/**
 * Mirror of the attendance module rule
 * (attendance/domain/services/subject-audience.ts), kept local because modules
 * do not import each other's domain. Keep both in sync.
 */
export interface AudienceSlot {
	readonly dayOfWeek: DAYOFWEEK;
	/** Workshop commission the slot targets; `null` targets the whole course. */
	readonly commissionNumber: CommissionNumber | null;
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

/** Class dates travel as `YYYY-MM-DD` (UTC midnight), so read the UTC weekday. */
export function weekdayOf(date: Date): DAYOFWEEK | undefined {
	return WEEKDAYS[date.getUTCDay()];
}

/**
 * Who a subject's roster is made of: with a weekday, only that weekday's slots
 * count (every slot if it has none); no slots, or any counted slot targeting
 * both commissions, means the whole course; otherwise the targeted commissions.
 */
export function resolveSubjectAudience(
	slots: readonly AudienceSlot[],
	weekday?: DAYOFWEEK,
): SubjectAudience {
	const ofDay = weekday ? slots.filter((s) => s.dayOfWeek === weekday) : [];
	const counted = ofDay.length > 0 ? ofDay : slots;
	if (counted.length === 0) return 'whole-course';
	const numbers = new Set<CommissionNumber>();
	for (const slot of counted) {
		if (slot.commissionNumber === null) return 'whole-course';
		numbers.add(slot.commissionNumber);
	}
	return [...numbers].sort((a, b) => a - b);
}
