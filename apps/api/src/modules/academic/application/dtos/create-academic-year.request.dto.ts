import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
	IsBoolean,
	IsDate,
	IsNotEmpty,
	IsNumber,
	IsOptional,
} from 'class-validator';

/**
 * El tenant (escuela) NO viaja en el body: el controller lo toma de la sesión
 * autenticada (`user.tenantId`). schoolId en el body era un campo muerto que
 * rompía la validación porque el form del cliente nunca lo envía.
 */
export class CreateAcademicYearRequestDto {
	@IsNotEmpty()
	@IsNumber()
	@ApiProperty({
		type: Number,
		description: 'Año calendario del ciclo lectivo.',
		example: 2026,
	})
	year!: number;

	@IsNotEmpty()
	@IsDate()
	@ApiProperty({
		type: String,
		format: 'date-time',
		description: 'Fecha de inicio del ciclo lectivo.',
		example: '2026-03-02T00:00:00.000Z',
	})
	startDate!: Date;

	@IsNotEmpty()
	@IsDate()
	@ApiProperty({
		type: String,
		format: 'date-time',
		description: 'Fecha de fin del ciclo lectivo.',
		example: '2026-12-18T00:00:00.000Z',
	})
	endDate!: Date;

	@IsOptional()
	@Transform(({ value }: { value?: unknown }) =>
		Array.isArray(value) ? value.map((day) => new Date(day as string)) : value,
	)
	@IsDate({
		each: true,
	})
	@ApiPropertyOptional({
		type: 'array',
		items: { type: 'string', format: 'date-time' },
		description:
			'Días no laborables del ciclo lectivo (feriados y recesos). Opcional; se envía como array de fechas ISO.',
		example: ['2026-07-09T00:00:00.000Z', '2026-12-25T00:00:00.000Z'],
	})
	nonWorkingDays?: Date[];

	@IsNotEmpty()
	@IsNumber()
	@ApiProperty({
		type: Number,
		minimum: 0,
		maximum: 100,
		description: 'Porcentaje de ausencias que dispara una alerta.',
		example: 15,
	})
	absenceThresholdPercent!: number;

	@IsNotEmpty()
	@IsNumber()
	@ApiProperty({
		type: Number,
		minimum: 0,
		description:
			'Minutos de tolerancia para contar una llegada tarde como ausencia.',
		example: 10,
	})
	lateCountAbscenseAfterMinutes!: number;

	@IsOptional()
	@IsBoolean()
	@ApiPropertyOptional({
		type: Boolean,
		description: 'Indica si el ciclo lectivo debe crearse como activo.',
		example: true,
	})
	isActive?: boolean;
}
