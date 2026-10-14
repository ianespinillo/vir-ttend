import { DAYOFWEEK } from '@repo/common';
import { AcademicYear } from '../entities/academic-year.entity';
import { ScheduleSlot } from '../entities/schedule-slot.entity';

export class ScheduleService {
	getSlotsForDate(date: Date, slots: ScheduleSlot[]): ScheduleSlot[] {
		if (date.getDay() > 4) return [];
		return slots.filter((slot) => slot.dayOfWeek === this.getDayOfWeek(date));
	}
	/**
	 * Class dates are calendar days stored as UTC midnight (`YYYY-MM-DD`
	 * columns), so weekdays and day keys are read in UTC: the result does not
	 * depend on the server timezone and matches the keys of attendance records.
	 */
	getWorkingDaysOnPeriod(
		from: Date,
		to: Date,
		academicYear: AcademicYear,
	): Date[] {
		const dates = [];
		const nonWorkingDayKeys = new Set(
			academicYear.nonWorkingDays.map((d) => this.toDateKey(d)),
		);
		let current = new Date(from);
		while (current <= to) {
			const isNonWorkingDay = nonWorkingDayKeys.has(this.toDateKey(current));
			if (
				!isNonWorkingDay &&
				current.getUTCDay() !== 0 &&
				current.getUTCDay() !== 6
			) {
				dates.push(current);
			}
			current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
		}
		return dates;
	}
	private toDateKey(date: Date | string): string {
		if (typeof date === 'string') return date.slice(0, 10);
		return date.toISOString().slice(0, 10);
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
