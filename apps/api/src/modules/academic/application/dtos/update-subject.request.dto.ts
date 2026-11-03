import { ApiPropertyOptional } from '@nestjs/swagger';
import { SUBJECT_KIND, SubjectKindType } from '@repo/common';
import { Type } from 'class-transformer';
import {
	ArrayMaxSize,
	IsArray,
	IsEnum,
	IsNumber,
	IsOptional,
	IsString,
	MaxLength,
	ValidateNested,
} from 'class-validator';
import { SubjectTeacherRequestDto } from './subject-teacher.request.dto';

export class UpdateSubjectRequestDto {
	@IsString()
	@IsOptional()
	@ApiPropertyOptional({
		type: String,
		description:
			'ID del nuevo docente a cargo de la materia. "NONE" quita el docente con usuario.',
		example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
	})
	teacherId?: string;

	@IsOptional()
	@IsString()
	@MaxLength(255)
	@ApiPropertyOptional({
		type: String,
		description:
			'Nombre del docente cuando no tiene usuario en el sistema. Reemplaza al docente con usuario; vacío deja la materia sin docente. Se ignora si se envía un teacherId real.',
		example: 'Laura Gómez',
	})
	teacherName?: string;

	@IsOptional()
	@IsArray()
	@ArrayMaxSize(2)
	@ValidateNested({ each: true })
	@Type(() => SubjectTeacherRequestDto)
	@ApiPropertyOptional({
		type: [SubjectTeacherRequestDto],
		description:
			'Docente por comisión de taller (solo materias de taller de un curso con dos comisiones). Si se envía, tiene prioridad sobre teacherId / teacherName; un único elemento con commissionNumber null equivale a un docente para toda la materia.',
	})
	teachers?: SubjectTeacherRequestDto[];

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({
		type: String,
		description: 'ID del curso al que pertenece la materia.',
		example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
	})
	courseId?: string;

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

	@IsOptional()
	@IsEnum(SUBJECT_KIND)
	@ApiPropertyOptional({
		enum: SUBJECT_KIND,
		description: 'Nuevo tipo de materia: teórica o de taller.',
		example: SUBJECT_KIND.WORKSHOP,
	})
	kind?: SubjectKindType;
}
