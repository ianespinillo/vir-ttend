import { DAYOFWEEK } from '@repo/common';

const DAYS: Partial<Record<number, DAYOFWEEK>> = {
	1: DAYOFWEEK.MONDAY,
	2: DAYOFWEEK.TUESDAY,
	3: DAYOFWEEK.WEDNESDAY,
	4: DAYOFWEEK.THURSDAY,
	5: DAYOFWEEK.FRIDAY,
};

/**
 * Class dates travel as `YYYY-MM-DD`, parsed as UTC midnight, so the weekday is
 * read in UTC. Weekends have no school day and return `undefined`.
 */
export function dayOfWeekOf(date: Date): DAYOFWEEK | undefined {
	return DAYS[date.getUTCDay()];
}
