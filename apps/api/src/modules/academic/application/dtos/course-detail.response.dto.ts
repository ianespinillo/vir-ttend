import { ApiProperty } from '@nestjs/swagger';
import { Course } from '../../domain/entities/course.entity';
import { ScheduleSlot } from '../../domain/entities/schedule-slot.entity';
import { Subject } from '../../domain/entities/subject.entity';
import { CourseResponseDto } from './course.response.dto';
import { ScheduleSlotResponseDto } from './schedule-slot.response.dto';
import { SubjectResponseDto } from './subject.response.dto';

// course-detail.response.dto.ts
export class CourseDetailResponseDto extends CourseResponseDto {
	@ApiProperty({
		type: [SubjectResponseDto],
		description: 'Materias asignadas al curso.',
		example: [
			{
				id: '550e8400-e29b-41d4-a716-446655440000',
				name: 'Matemática',
				area: 'Ciencias Exactas',
				weeklyHours: 5,
				teacherId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
			},
		],
	})
	subjects: SubjectResponseDto[];

	@ApiProperty({
		type: [ScheduleSlotResponseDto],
		description: 'Bloques horarios asignados al curso.',
		example: [
			{
				id: 'b2c3d4e5-6f7a-8b9c-0d1e-2f3a4b5c6d7e',
				subjectId: '550e8400-e29b-41d4-a716-446655440000',
				dayOfWeek: 'monday',
				startTime: '08:00',
				endTime: '09:00',
			},
		],
	})
	schedule: ScheduleSlotResponseDto[];

	constructor(
		course: Course,
		subjects: Subject[],
		slots: ScheduleSlot[],
		preceptorName: string,
	) {
		super(course, preceptorName);
		this.subjects = subjects.map((s) => new SubjectResponseDto(s));
		this.schedule = slots.map((s) => new ScheduleSlotResponseDto(s));
	}
}
