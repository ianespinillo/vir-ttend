import { ApiProperty } from '@nestjs/swagger';
import { Equals } from 'class-validator';

export class RegenerateWorkshopCommissionsRequestDto {
	@Equals(true, { message: 'confirm debe ser true para regenerar la división.' })
	@ApiProperty({
		type: Boolean,
		description:
			'Confirmación obligatoria: la regeneración mueve estudiantes con historial.',
		example: true,
	})
	confirm!: boolean;
}
