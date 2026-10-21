import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SHIFT } from '@repo/common';
import { Transform } from 'class-transformer';
import {
	IsArray,
	IsBoolean,
	IsDate,
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
} from 'class-validator';

export class DeclareNonWorkingDayRequestDto {
	@Transform(({ value }: { value?: unknown }) =>
		value ? new Date(value as string) : value,
	)
	@IsDate({ message: 'La fecha debe ser válida (formato ISO 8601)' })
	@ApiProperty({
		type: String,
		format: 'date-time',
		description: 'Fecha del día no laborable.',
		example: '2026-05-15T00:00:00.000Z',
	})
	date!: Date;

	@IsString({ message: 'El motivo debe ser una cadena de texto' })
	@IsNotEmpty({ message: 'El motivo es obligatorio' })
	@ApiProperty({
		type: String,
		description:
			'Motivo de la suspensión de clases o día no laborable (ej: Paro docente, Movilización, Feriado puente).',
		example: 'Paro docente por reclamo salarial',
	})
	reason!: string;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional({
		type: String,
		description: 'Tipo o categoría del día no laborable.',
		example: 'strike',
	})
	type?: string;

	@IsOptional()
	@IsBoolean()
	@ApiPropertyOptional({
		type: Boolean,
		description:
			'Indica si debe emitirse y publicarse un comunicado a nivel colegio con la suspensión.',
		default: true,
		example: true,
	})
	notifySchool?: boolean;

	@IsOptional()
	@IsArray({ message: 'Los turnos deben ser una lista' })
	@IsEnum(SHIFT, {
		each: true,
		message: 'Cada turno debe ser MORNING, AFTERNOON o EVENING',
	})
	@ApiPropertyOptional({
		enum: SHIFT,
		isArray: true,
		description:
			'Turnos a los que aplica la suspensión. Vacío u omitido = todos los turnos (el día completo).',
		example: [SHIFT.MORNING],
	})
	shifts?: SHIFT[];
}
