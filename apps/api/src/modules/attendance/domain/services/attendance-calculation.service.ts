import { ATTENDANCE_STATUS, DAYOFWEEK } from '@repo/common';
import { ScheduleSlot } from '../../../academic/domain/entities/schedule-slot.entity';
import { AttendanceRecord } from '../entities/attendance-record.entity';

export class AttendanceCalculationService {
	calculateAbscensePercent(
		records: AttendanceRecord[],
		workingDaysQ: number,
	): number {
		let total = 0;
		records.forEach((record) => {
			if (
				record.status === ATTENDANCE_STATUS.LATE ||
				record.status === ATTENDANCE_STATUS.ABSENT
			)
				total++;
		});
		return (total / workingDaysQ) * 100;
	}
	getExpectedClasses(slots: ScheduleSlot[], workingDays: Date[]): number {
		let total = 0;
		workingDays.forEach((workingDay) => {
			slots.map((slot) => {
				if (slot.dayOfWeek === this.getDayOfWeek(workingDay)) total++;
			});
		});
		return total;
	}
	private getDayOfWeek(date: Date): DAYOFWEEK {
		const days: Record<number, DAYOFWEEK> = {
			0: DAYOFWEEK.MONDAY,
			1: DAYOFWEEK.TUESDAY,
			2: DAYOFWEEK.WEDNESDAY,
			3: DAYOFWEEK.THURSDAY,
			4: DAYOFWEEK.FRIDAY,
		};
		return days[date.getDay()];
	}
}
