import { ApiPropertyOptional } from '@nestjs/swagger';
import { COMMISSION_COUNTS, CommissionCount } from '@repo/common';
import { IsIn, IsOptional } from 'class-validator';

export class CreateWorkshopCommissionsRequestDto {
	@IsOptional()
	@IsIn(COMMISSION_COUNTS, {
		message: 'count debe ser 1 o 2.',
	})
	@ApiPropertyOptional({
		enum: COMMISSION_COUNTS,
		description:
			'Cantidad de comisiones: 1 (todos los estudiantes activos en la comisión 1) o 2 (reparto alfabético mitad y mitad). Por defecto 2.',
		example: 2,
	})
	count?: CommissionCount;
}
