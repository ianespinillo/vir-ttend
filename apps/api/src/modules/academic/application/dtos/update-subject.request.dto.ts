import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateSubjectRequestDto {
	@IsString()
	@IsOptional()
	@ApiPropertyOptional({
		type: String,
		description: 'ID del nuevo docente a cargo de la materia.',
		example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
	})
	teacherId?: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({
		type: String,
		description: 'Nuevo nombre de la materia.',
		example: 'Matemática',
	})
	name?: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({
		type: String,
		description: 'Nueva área de la materia.',
		example: 'Ciencias Exactas',
	})
	area?: string;

	@IsOptional()
	@IsNumber()
	@ApiPropertyOptional({
		type: Number,
		minimum: 1,
		description: 'Nueva carga horaria semanal en horas.',
		example: 6,
	})
	weeklyHours?: number;
}
