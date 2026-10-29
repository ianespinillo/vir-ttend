import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsDateString,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
} from 'class-validator';

export class MarkWorkshopSessionNotHeldRequestDto {
	@IsUUID()
	@ApiProperty({
		description: 'Identificador de la comisión de taller que no se dictó',
		example: '4d7a2b1c-3e5f-4a6b-8c9d-0e1f2a3b4c5d',
	})
	commissionId!: string;

	@IsDateString()
	@ApiProperty({
		description: 'Fecha del taller no dictado',
		example: '2026-03-10',
	})
	date!: string;

	@IsString()
	@IsOptional()
	@MaxLength(500)
	@ApiPropertyOptional({
		description: 'Motivo por el que no se dictó el taller',
		example: 'Ausencia del docente',
	})
	reason?: string;
}

/** Commission and date, as query parameters of the unmark and read endpoints. */
export class WorkshopSessionNotHeldQueryRequestDto {
	@IsUUID()
	@ApiProperty({
		description: 'Identificador de la comisión de taller',
		example: '4d7a2b1c-3e5f-4a6b-8c9d-0e1f2a3b4c5d',
	})
	commissionId!: string;

	@IsDateString()
	@ApiProperty({
		description: 'Fecha del taller (YYYY-MM-DD)',
		example: '2026-03-10',
	})
	date!: string;
}
