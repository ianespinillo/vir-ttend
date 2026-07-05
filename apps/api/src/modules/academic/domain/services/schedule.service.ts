import { DAYOFWEEK } from '@repo/common';
import { AcademicYear } from '../entities/academic-year.entity';
import { ScheduleSlot } from '../entities/schedule-slot.entity';

export class ScheduleService {
	getSlotsForDate(date: Date, slots: ScheduleSlot[]): ScheduleSlot[] {
		if (date.getDay() > 4) return [];
		return slots.filter((slot) => slot.dayOfWeek === this.getDayOfWeek(date));
	}
	getWorkingDaysOnPeriod(
		from: Date,
		to: Date,
		academicYear: AcademicYear,
	): Date[] {
		const dates = [];
		let current = new Date(from);
		while (current <= to) {
			const isNonWorkingDay = academicYear.nonWorkingDays.some(
				(d) => d.toDateString() === current.toDateString(),
			);
			if (!isNonWorkingDay && current.getDay() !== 0 && current.getDay() !== 6) {
				dates.push(current);
			}
			current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
		}
		return dates;
	}
	private getDayOfWeek(date: Date): DAYOFWEEK {
		const days: Record<number, DAYOFWEEK> = {
			1: DAYOFWEEK.MONDAY,
			2: DAYOFWEEK.TUESDAY,
			3: DAYOFWEEK.WEDNESDAY,
			4: DAYOFWEEK.THURSDAY,
			5: DAYOFWEEK.FRIDAY,
		};
		return days[date.getDay()];
	}
}
