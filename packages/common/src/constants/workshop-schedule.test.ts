import { describe, expect, it } from 'vitest';
import { DAYOFWEEK } from './day-of-week.enum.js';
import { SUBJECT_KIND } from './subject-kind.enum.js';
import {
	hasWorkshopOn,
	schoolWeekdayOf,
	workshopAvailabilityOn,
	workshopDaysOf,
} from './workshop-schedule.js';

const subjects = [
	{ id: 'workshop-a', kind: SUBJECT_KIND.WORKSHOP },
	{ id: 'workshop-b', kind: SUBJECT_KIND.WORKSHOP },
	{ id: 'theory', kind: SUBJECT_KIND.THEORY },
	{ id: 'legacy' },
];

describe('schoolWeekdayOf', () => {
	it('reads the weekday from the calendar date', () => {
		expect(schoolWeekdayOf('2026-11-02')).toBe(DAYOFWEEK.MONDAY);
		expect(schoolWeekdayOf('2026-11-06')).toBe(DAYOFWEEK.FRIDAY);
	});

	it('does not depend on the process timezone', () => {
		const previous = process.env.TZ;
		try {
			for (const tz of ['America/Argentina/Buenos_Aires', 'Pacific/Auckland']) {
				process.env.TZ = tz;
				expect(schoolWeekdayOf('2026-11-02')).toBe(DAYOFWEEK.MONDAY);
			}
		} finally {
			process.env.TZ = previous;
		}
	});

	it('returns undefined on weekends and malformed or impossible dates', () => {
		expect(schoolWeekdayOf('2026-11-01')).toBeUndefined();
		expect(schoolWeekdayOf('2026-11-07')).toBeUndefined();
		expect(schoolWeekdayOf('2026-02-31')).toBeUndefined();
		expect(schoolWeekdayOf('02/11/2026')).toBeUndefined();
	});
});

describe('workshopDaysOf', () => {
	const slots = [
		{
			subjectId: 'workshop-a',
			dayOfWeek: DAYOFWEEK.MONDAY,
			commissionNumber: 1 as const,
		},
		{
			subjectId: 'workshop-b',
			dayOfWeek: DAYOFWEEK.TUESDAY,
			commissionNumber: 2 as const,
		},
		{
			subjectId: 'workshop-a',
			dayOfWeek: DAYOFWEEK.WEDNESDAY,
			commissionNumber: null,
		},
		{ subjectId: 'workshop-a', dayOfWeek: DAYOFWEEK.WEDNESDAY },
		{ subjectId: 'theory', dayOfWeek: DAYOFWEEK.THURSDAY },
		{ subjectId: 'legacy', dayOfWeek: DAYOFWEEK.FRIDAY },
	];

	it('keeps workshop slots of the commission and of the whole course', () => {
		expect(workshopDaysOf(slots, subjects, 1)).toEqual([
			DAYOFWEEK.MONDAY,
			DAYOFWEEK.WEDNESDAY,
		]);
		expect(workshopDaysOf(slots, subjects, 2)).toEqual([
			DAYOFWEEK.TUESDAY,
			DAYOFWEEK.WEDNESDAY,
		]);
	});

	it('ignores theory slots and subjects without a kind', () => {
		const theoryOnly = slots.filter((s) =>
			['theory', 'legacy'].includes(s.subjectId),
		);
		expect(workshopDaysOf(theoryOnly, subjects, 1)).toEqual([]);
	});

	it('is empty when nothing is loaded', () => {
		expect(workshopDaysOf([], [], 1)).toEqual([]);
		expect(workshopDaysOf(slots, [], 1)).toEqual([]);
	});
});

describe('hasWorkshopOn and workshopAvailabilityOn', () => {
	const days = [DAYOFWEEK.MONDAY, DAYOFWEEK.WEDNESDAY];

	it('is scheduled on a workshop weekday', () => {
		expect(hasWorkshopOn(days, '2026-11-02')).toBe(true);
		expect(workshopAvailabilityOn(days, '2026-11-02')).toBe('scheduled');
	});

	it('is unscheduled on another weekday or a weekend', () => {
		expect(hasWorkshopOn(days, '2026-11-03')).toBe(false);
		expect(workshopAvailabilityOn(days, '2026-11-03')).toBe('unscheduled');
		expect(workshopAvailabilityOn(days, '2026-11-07')).toBe('unscheduled');
	});

	it('reports no schedule when the commission has no workshop day at all', () => {
		expect(workshopAvailabilityOn([], '2026-11-02')).toBe('no-schedule');
	});
});
