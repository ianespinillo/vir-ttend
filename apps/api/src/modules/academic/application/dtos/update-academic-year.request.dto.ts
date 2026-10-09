import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsOptional } from 'class-validator';

export class UpdateAcademicYearRequestDto {
	@IsOptional()
	@IsNumber()
	@ApiPropertyOptional({
		type: Number,
		description: 'Año calendario del ciclo lectivo.',
		example: 2026,
	})
	year?: number;

	@IsOptional()
	@Transform(({ value }: { value?: unknown }) =>
		value ? new Date(value as string) : value,
	)
	@IsDate()
	@ApiPropertyOptional({
		type: String,
		format: 'date-time',
		description: 'Fecha de inicio del ciclo lectivo.',
		example: '2026-03-02T00:00:00.000Z',
	})
	startDate?: Date;

	@IsOptional()
	@Transform(({ value }: { value?: unknown }) =>
		value ? new Date(value as string) : value,
	)
	@IsDate()
	@ApiPropertyOptional({
		type: String,
		format: 'date-time',
		description: 'Fecha de fin del ciclo lectivo.',
		example: '2026-12-18T00:00:00.000Z',
	})
	endDate?: Date;

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
		description: 'Días no laborables del ciclo lectivo.',
		example: ['2026-08-17T00:00:00.000Z'],
	})
	nonWorkingDays?: Date[];

	@IsOptional()
	@IsNumber()
	@ApiPropertyOptional({
		type: Number,
		minimum: 0,
		maximum: 100,
		description: 'Porcentaje de ausencias que dispara una alerta.',
		example: 20,
	})
	absenceThresholdPercent?: number;

	@IsOptional()
	@IsNumber()
	@ApiPropertyOptional({
		type: Number,
		minimum: 0,
		description:
			'Minutos de tolerancia para contar una llegada tarde como ausencia.',
		example: 15,
	})
	lateCountAbscenseAfterMinutes?: number;

	@IsOptional()
	@IsBoolean()
	@ApiPropertyOptional({
		type: Boolean,
		description: 'Indica si el ciclo lectivo está activo.',
		example: true,
	})
	isActive?: boolean;
}
