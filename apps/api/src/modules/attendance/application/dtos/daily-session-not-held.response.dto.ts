import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DailySessionNotHeldResponseDto {
	@ApiProperty({
		description: 'Si la clase de teoría del curso está marcada como no dictada',
		example: true,
	})
	notHeld: boolean;

	@ApiPropertyOptional({
		description: 'Motivo informado al marcar la clase como no dictada',
		example: 'Ausencia del docente',
	})
	reason?: string;

	constructor(notHeld: boolean, reason?: string) {
		this.notHeld = notHeld;
		this.reason = reason;
	}
}
