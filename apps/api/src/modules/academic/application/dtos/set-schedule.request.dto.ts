import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DAYOFWEEK } from '@repo/common';
import { Type } from 'class-transformer';
import {
	IsArray,
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	ValidateNested,
} from 'class-validator';

export class ScheduleSlotRequestDto {
	@ApiPropertyOptional({
		type: String,
		description: 'ID de la materia a la que pertenece el bloque.',
		example: '550e8400-e29b-41d4-a716-446655440000',
	})
	@IsOptional()
	@IsString()
	subjectId?: string;

	@ApiProperty({
		enum: DAYOFWEEK,
		description: 'Día de la semana del bloque.',
		example: DAYOFWEEK.MONDAY,
	})
	@IsNotEmpty()
	@IsEnum(DAYOFWEEK)
	dayOfWeek!: DAYOFWEEK;

	@ApiProperty({
		type: String,
		description: 'Hora de inicio (formato HH:mm).',
		example: '08:00',
	})
	@IsNotEmpty()
	@IsString()
	startTime!: string;

	@ApiProperty({
		type: String,
		description: 'Hora de fin (formato HH:mm).',
		example: '09:00',
	})
	@IsNotEmpty()
	@IsString()
	endTime!: string;
}

export class SetScheduleRequestDto {
	@IsOptional()
	@IsString()
	@ApiPropertyOptional({
		type: String,
		description: 'ID de la materia a la que se le asigna el horario.',
		example: '550e8400-e29b-41d4-a716-446655440000',
	})
	subjectId?: string;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional({
		type: String,
		description: 'ID del curso al que se le asigna el horario completo.',
		example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
	})
	courseId?: string;

	@IsNotEmpty()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ScheduleSlotRequestDto)
	@ApiProperty({
		type: [ScheduleSlotRequestDto],
		description:
			'Bloques horarios que reemplazan el horario de la materia o del curso.',
		example: [
			{ dayOfWeek: 'monday', startTime: '08:00', endTime: '09:00' },
			{ dayOfWeek: 'wednesday', startTime: '08:00', endTime: '09:00' },
		],
	})
	slots!: ScheduleSlotRequestDto[];
}
