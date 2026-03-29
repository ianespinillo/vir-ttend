import { DAYOFWEEK } from '@repo/common';
import { ScheduleSlot } from '../entities/schedule-slot.entity';

export interface IScheduleRepository {
	findBySubject(subjectId: string): Promise<ScheduleSlot[]>;
	findByCourse(courseId: string): Promise<ScheduleSlot[]>;
	findByCourseAndDay(
		subjectId: string,
		day: DAYOFWEEK,
	): Promise<ScheduleSlot | null>;
	deleteBySubject(subjectId: string): Promise<void>;
	save(scheduleSlot: ScheduleSlot): Promise<void>;
	saveMany(slots: ScheduleSlot[]): Promise<void>;
}
