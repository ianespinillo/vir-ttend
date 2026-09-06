import { ApiProperty } from '@nestjs/swagger';
import {
	ICourseResponse,
	LEVEL,
	LevelType,
	SHIFT,
	ShiftType,
} from '@repo/common';
import { Course } from '../../domain/entities/course.entity';
import { CourseService } from '../../domain/services/course.service';

// course.response.dto.ts
export class CourseResponseDto implements ICourseResponse {
	@ApiProperty({
		type: String,
		description: 'Identificador único del curso.',
		example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
	})
	id: string;

	@ApiProperty({
		enum: LEVEL,
		description: 'Nivel educativo del curso.',
		example: LEVEL.SECONDARY,
	})
	level: LevelType;

	@ApiProperty({
		type: Number,
		minimum: 1,
		maximum: 7,
		description: 'Año del nivel educativo (1 a 7).',
		example: 1,
	})
	yearNumber: number;

	@ApiProperty({
		type: String,
		description: 'División del curso.',
		example: 'A',
	})
	division: string;

	@ApiProperty({
		enum: SHIFT,
		description: 'Turno al que asiste el curso.',
		example: SHIFT.MORNING,
	})
	shift: ShiftType;

	@ApiProperty({
		type: String,
		description: 'ID del preceptor asignado al curso.',
		example: 'd7e8f9a0-1b2c-3d4e-5f6a-7b8c9d0e1f2a',
	})
	preceptorId: string;

	@ApiProperty({
		type: String,
		description: 'Nombre del preceptor asignado al curso.',
		example: 'Juan Pérez',
	})
	preceptorName: string;

	@ApiProperty({
		type: String,
		description: 'Nombre completo del curso.',
		example: '1° A - Morning',
	})
	fullName: string;

	constructor(course: Course, preceptorName: string) {
		this.id = course.id.getRaw();
		this.preceptorName = preceptorName;
		this.level = course.level;
		this.yearNumber = course.yearNumber;
		this.division = course.division;
		this.shift = course.shift;
		this.preceptorId = course.preceptorId;
		this.fullName = CourseService.calculateFulName(course);
	}
}
