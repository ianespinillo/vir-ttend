import { ApiPropertyOptional } from '@nestjs/swagger';
import { LEVEL, LevelType, SHIFT, ShiftType } from '@repo/common';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateCourseRequestDto {
	@IsString()
	@IsOptional()
	@ApiPropertyOptional({
		type: String,
		description: 'ID del nuevo preceptor asignado al curso.',
		example: 'd7e8f9a0-1b2c-3d4e-5f6a-7b8c9d0e1f2a',
	})
	preceptorId?: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({
		enum: SHIFT,
		description: 'Nuevo turno del curso.',
		example: SHIFT.MORNING,
	})
	shift?: ShiftType;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({
		type: String,
		description: 'ID del año académico (opcional).',
	})
	academicYearId?: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({
		type: String,
		description: 'ID de la escuela/tenant (opcional).',
	})
	schoolId?: string;

	@IsOptional()
	@ApiPropertyOptional({
		enum: LEVEL,
		description: 'Nivel educativo (opcional).',
	})
	level?: LevelType;

	@IsNumber()
	@IsOptional()
	@ApiPropertyOptional({
		type: Number,
		description: 'Año/grado (opcional).',
	})
	yearNumber?: number;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({
		type: String,
		description: 'División (opcional).',
	})
	division?: string;
}
