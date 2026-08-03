import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// justification.response.dto.ts
import { Justification } from '../../domain/entities/justification.entity';

export class JustificationResponseDto {
	@ApiProperty({
		description: 'Identificador de la justificación',
		example: '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e',
	})
	readonly id: string;

	@ApiProperty({
		description: 'Motivo de la justificación',
		example: 'Certificado médico',
	})
	readonly reason: string;

	@ApiPropertyOptional({
		description: 'Notas adicionales de la justificación',
		example: 'Presenta certificado emitido por el hospital público',
	})
	readonly notes?: string;

	@ApiProperty({
		description: 'Identificador del usuario que registró la justificación',
		example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
	})
	readonly createdBy: string;

	@ApiProperty({
		description: 'Fecha y hora en la que se registró la justificación',
		example: '2026-03-10T14:30:00.000Z',
		type: Date,
		format: 'date-time',
	})
	readonly createdAt: Date;

	constructor(justification: Justification) {
		this.id = justification.id;
		this.reason = justification.reason.getRaw();
		this.notes = justification.notes;
		this.createdBy = justification.createdBy;
		this.createdAt = justification.createdAt;
	}
}
