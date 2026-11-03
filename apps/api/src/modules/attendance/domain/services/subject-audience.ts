import { CommissionNumber, DAYOFWEEK } from '@repo/common';

/** The slot fields that decide who attends a subject. */
export interface AudienceSlot {
	readonly dayOfWeek: DAYOFWEEK;
	/** Workshop commission the slot targets; `null` targets the whole course. */
	readonly commissionNumber: CommissionNumber | null;
}

/** Either every student of the course, or the students of these commissions. */
export type SubjectAudience = 'whole-course' | CommissionNumber[];

/**
 * Who a subject's roster is made of, derived from its schedule slots:
 * - with a weekday, only that weekday's slots count; if it has none, every slot
 *   counts (same as asking without a weekday);
 * - no slots, or any counted slot targeting both commissions (theory subjects
 *   always do), means the whole course;
 * - otherwise, the commissions the counted slots target, ascending.
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

/**
 * Narrows an audience to the commissions a teacher teaches ('all' keeps it
 * as is). A whole-course audience becomes the teacher's commissions; a
 * commission audience keeps only the ones they teach (possibly none).
 */
export function restrictAudience(
	audience: SubjectAudience,
	taught: 'all' | CommissionNumber[],
): SubjectAudience {
	if (taught === 'all') return audience;
	if (audience === 'whole-course') return [...taught].sort((a, b) => a - b);
	return audience.filter((number) => taught.includes(number));
}
