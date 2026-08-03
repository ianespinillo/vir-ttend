import { ApiProperty } from '@nestjs/swagger';
// alerts-count.response.dto.ts
export class AlertsCountResponseDto {
	@ApiProperty({
		description: 'Cantidad de alertas de asistencia sin ver del preceptor',
		example: 12,
		minimum: 0,
	})
	count!: number;

	constructor(count: number) {
		this.count = count;
	}
}
