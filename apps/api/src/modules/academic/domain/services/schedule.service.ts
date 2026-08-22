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
		const nonWorkingDayKeys = new Set(
			academicYear.nonWorkingDays.map((d) => this.toDateKey(d)),
		);
		let current = new Date(from);
		while (current <= to) {
			const isNonWorkingDay = nonWorkingDayKeys.has(this.toDateKey(current));
			if (!isNonWorkingDay && current.getDay() !== 0 && current.getDay() !== 6) {
				dates.push(current);
			}
			current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
		}
		return dates;
	}
	private toDateKey(date: Date | string): string {
		if (typeof date === 'string') return date.slice(0, 10);
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
