import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SUBJECT_KIND, SubjectKindType } from '@repo/common';
import { Type } from 'class-transformer';
import {
	ArrayMaxSize,
	IsArray,
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	MaxLength,
	Min,
	ValidateNested,
} from 'class-validator';
import { SubjectTeacherRequestDto } from './subject-teacher.request.dto';

export class CreateSubjectRequestDto {
	@IsNotEmpty()
	@IsString()
	@ApiProperty({
		type: String,
		description: 'ID del curso al que pertenece la materia.',
		example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
	})
	courseId!: string;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional({
		type: String,
		description: 'ID del docente a cargo de la materia (opcional).',
		example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
	})
	teacherId?: string;

	@IsOptional()
	@IsString()
	@MaxLength(255)
	@ApiPropertyOptional({
		type: String,
		description:
			'Nombre del docente cuando no tiene usuario en el sistema. Se ignora si se envía teacherId.',
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

	@IsNotEmpty({ message: 'El nombre de la materia es obligatorio.' })
	@IsString()
	@ApiProperty({
		type: String,
		description: 'Nombre de la materia.',
		example: 'Matemática',
	})
	name!: string;

	@IsNotEmpty({ message: 'El área o departamento es obligatorio.' })
	@IsString()
	@ApiProperty({
		type: String,
		description: 'Área o departamento de la materia.',
		example: 'Ciencias Exactas',
	})
	area!: string;

	@IsNotEmpty({ message: 'La carga horaria semanal es obligatoria.' })
	@IsNumber({}, { message: 'Las horas semanales deben ser un número.' })
	@Min(1, { message: 'Las horas semanales deben ser al menos 1.' })
	@ApiProperty({
		type: Number,
		minimum: 1,
		description: 'Carga horaria semanal en horas.',
		example: 5,
	})
	weeklyHours!: number;

	@IsOptional()
	@IsEnum(SUBJECT_KIND)
	@ApiPropertyOptional({
		enum: SUBJECT_KIND,
		default: SUBJECT_KIND.THEORY,
		description: 'Tipo de materia: teórica (por defecto) o de taller.',
		example: SUBJECT_KIND.WORKSHOP,
	})
	kind?: SubjectKindType;
}
