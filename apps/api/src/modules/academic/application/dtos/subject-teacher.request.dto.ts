import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { COMMISSION_NUMBERS, CommissionNumber } from '@repo/common';
import {
	IsIn,
	IsOptional,
	IsString,
	MaxLength,
	ValidateIf,
} from 'class-validator';

/** Teacher of a subject for one workshop commission (null = the whole subject). */
export class SubjectTeacherRequestDto {
	@ValidateIf((_, value) => value !== null)
	@IsIn(COMMISSION_NUMBERS)
	@ApiProperty({
		type: Number,
		nullable: true,
		enum: COMMISSION_NUMBERS,
		description:
			'Comisión de taller que dicta el docente; null cuando cubre toda la materia.',
		example: 1,
	})
	commissionNumber!: CommissionNumber | null;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional({
		type: String,
		description: 'ID del docente con usuario.',
		example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
	})
	teacherId?: string;

	@IsOptional()
	@IsString()
	@MaxLength(255)
	@ApiPropertyOptional({
		type: String,
		description:
			'Nombre del docente sin usuario. Se ignora si se envía teacherId.',
		example: 'Laura Gómez',
	})
	teacherName?: string;
}
