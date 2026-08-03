import { ApiProperty } from '@nestjs/swagger';
import { LEVEL, LevelType, SHIFT, ShiftType } from '@repo/common';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateCourseRequestDto {
	@IsNotEmpty()
	@IsString()
	@ApiProperty({
		type: String,
		description: 'ID del año académico al que pertenece el curso.',
		example: 'c9b1a7f2-8d3e-4f5a-9c6b-0d1e2f3a4b5c',
	})
	academicYearId!: string;

	@IsNotEmpty()
	@IsString()
	@ApiProperty({
		type: String,
		description: 'ID del tenant (escuela) al que pertenece el curso.',
		example: 'a1b2c3d4-5e6f-7890-abcd-ef1234567890',
	})
	schoolId!: string;

	@IsNotEmpty()
	@IsEnum(LEVEL)
	@ApiProperty({
		enum: LEVEL,
		description: 'Nivel educativo del curso.',
		example: LEVEL.SECONDARY,
	})
	level!: LevelType;

	@IsNotEmpty()
	@IsEnum(SHIFT)
	@ApiProperty({
		enum: SHIFT,
		description: 'Turno al que asiste el curso.',
		example: SHIFT.MORNING,
	})
	shift!: ShiftType;

	@IsNotEmpty()
	@IsNumber()
	@ApiProperty({
		type: Number,
		minimum: 1,
		maximum: 7,
		description: 'Año del nivel educativo (1 a 7).',
		example: 1,
	})
	yearNumber!: number;

	@IsNotEmpty()
	@IsString()
	@ApiProperty({
		type: String,
		description: 'División del curso.',
		example: 'A',
	})
	division!: string;

	@IsNotEmpty()
	@IsString()
	@ApiProperty({
		type: String,
		description: 'ID del preceptor asignado al curso.',
		example: 'd7e8f9a0-1b2c-3d4e-5f6a-7b8c9d0e1f2a',
	})
	preceptorId!: string;
}
