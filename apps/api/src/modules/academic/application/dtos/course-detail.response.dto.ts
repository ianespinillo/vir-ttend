import { Course } from '../../domain/entities/course.entity';
import { ScheduleSlot } from '../../domain/entities/schedule-slot.entity';
import { Subject } from '../../domain/entities/subject.entity';
import { CourseResponseDto } from './course.response.dto';
import { ScheduleSlotResponseDto } from './schedule-slot.response.dto';
import { SubjectResponseDto } from './subject.response.dto';

// course-detail.response.dto.ts
export class CourseDetailResponseDto extends CourseResponseDto {
	subjects: SubjectResponseDto[];
	schedule: ScheduleSlotResponseDto[];

	constructor(course: Course, subjects: Subject[], slots: ScheduleSlot[]) {
		super(course);
		this.subjects = subjects.map((s) => new SubjectResponseDto(s));
		this.schedule = slots.map((s) => new ScheduleSlotResponseDto(s));
	}
}
