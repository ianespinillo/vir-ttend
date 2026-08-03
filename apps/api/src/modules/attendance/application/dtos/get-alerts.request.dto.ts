import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
// get-alerts.request.dto.ts — como query params
import { IsEnum, IsInt, IsOptional, IsUUID } from 'class-validator';
import { AlertType } from '../../domain/value-objects/alert-type.vo';

export class GetAlertsRequestDto {
	@IsUUID()
	@IsOptional()
	@ApiPropertyOptional({
		description: 'Identificador del curso para filtrar las alertas',
		example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
	})
	courseId?: string;

	// Fix: This is not a Enum
	@IsEnum(AlertType)
	@IsOptional()
	@ApiPropertyOptional({
		description: 'Nivel de alerta para filtrar: warning, critical o exceeded',
		example: 'warning',
	})
	alertType?: AlertType;

	@IsInt()
	@IsOptional()
	@Type(() => Number)
	@ApiPropertyOptional({
		description: 'Número de página',
		example: 1,
		minimum: 1,
	})
	page?: number = 1;

	@IsInt()
	@IsOptional()
	@Type(() => Number)
	@ApiPropertyOptional({
		description: 'Cantidad de alertas por página',
		example: 20,
		minimum: 1,
	})
	limit?: number = 20;
}
