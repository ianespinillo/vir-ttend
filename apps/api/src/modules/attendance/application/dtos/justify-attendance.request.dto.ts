import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// justify-attendance.request.dto.ts
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class JustifyAttendanceRequestDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({
		description: 'Motivo de la justificación de la inasistencia',
		example: 'Certificado médico',
	})
	reason!: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({
		description: 'Notas adicionales sobre la justificación',
		example: 'Presenta certificado emitido por el hospital',
	})
	notes?: string;
}
