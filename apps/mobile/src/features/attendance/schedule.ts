import type { WeekdayKey } from '../../lib/date';
import type { MySubject, SubjectSlot } from './types';

export interface TodaySubject {
	subject: MySubject;
	/** Slots of the subject on the requested weekday, ordered by start time. */
	slots: SubjectSlot[];
}

const byStartTime = (a: SubjectSlot, b: SubjectSlot): number =>
	a.startTime.localeCompare(b.startTime);

/** Slots of a subject that fall on the given weekday, ordered by start time. */
export const slotsOnWeekday = (
	subject: MySubject,
	weekday: WeekdayKey,
): SubjectSlot[] =>
	subject.slots.filter((slot) => slot.dayOfWeek === weekday).sort(byStartTime);

export const hasClassOnWeekday = (
	subject: MySubject,
	weekday: WeekdayKey,
): boolean => subject.slots.some((slot) => slot.dayOfWeek === weekday);

/** Subjects with a class on the weekday, ordered by their first slot. */
export const getTodaysSubjects = (
	subjects: readonly MySubject[],
	weekday: WeekdayKey,
): TodaySubject[] =>
	subjects
		.map((subject) => ({ subject, slots: slotsOnWeekday(subject, weekday) }))
		.filter((entry) => entry.slots.length > 0)
		.sort((a, b) => byStartTime(a.slots[0], b.slots[0]));

/** `08:00 – 09:00`. */
export const formatSlotRange = (slot: SubjectSlot): string =>
	`${slot.startTime} – ${slot.endTime}`;

/** `08:00 – 09:00 · 10:00 – 11:00`. */
export const formatSlotRanges = (slots: readonly SubjectSlot[]): string =>
	slots.map(formatSlotRange).join(' · ');
