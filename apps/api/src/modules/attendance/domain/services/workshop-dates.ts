import { DAYOFWEEK } from '@repo/common';
import { dayOfWeekOf } from './day-of-week.util';

/** The working days that fall on one of the workshop weekdays. */
export function selectWorkshopDates(
	workingDays: readonly Date[],
	workshopWeekdays: readonly DAYOFWEEK[],
): Date[] {
	const weekdays = new Set(workshopWeekdays);
	return workingDays.filter((day) => {
		const weekday = dayOfWeekOf(day);
		return weekday !== undefined && weekdays.has(weekday);
	});
}
