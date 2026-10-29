import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WorkshopSessionNotHeldResponseDto {
	@ApiProperty({
		description: 'Si el taller de la comisión está marcado como no dictado',
		example: true,
	})
	notHeld: boolean;

	@ApiPropertyOptional({
		description: 'Motivo informado al marcar el taller como no dictado',
		example: 'Ausencia del docente',
	})
	reason?: string;

	constructor(notHeld: boolean, reason?: string) {
		this.notHeld = notHeld;
		this.reason = reason;
	}
}
