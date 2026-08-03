import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsNumber, IsOptional } from 'class-validator';

export class UpdateAcademicYearRequestDto {
	@IsDate({
		each: true,
	})
	@IsOptional()
	@ApiPropertyOptional({
		type: 'array',
		items: { type: 'string', format: 'date-time' },
		description: 'Días no laborables a agregar al ciclo lectivo.',
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
}
