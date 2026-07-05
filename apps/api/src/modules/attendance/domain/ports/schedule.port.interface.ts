import { ScheduleSlot } from '../entities/schedule-slot.entity';

export interface ISchedulePort {
	findByCourse(courseId: string): Promise<ScheduleSlot[]>;
	findBySubject(subjectId: string): Promise<ScheduleSlot[]>;
	getWorkingDaysOnPeriod(
		from: Date,
		to: Date,
		academicYearId: string,
	): Promise<Date[]>;
}
