import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

// transfer-student.request.dto.ts
// Traslado: pase a otra escuela. No requiere curso de destino; el courseId
// actual se conserva como referencia histórica.
export class TransferStudentRequestDto {
	@IsOptional()
	@IsString()
	@MaxLength(255)
	@ApiPropertyOptional({
		type: String,
		description: 'Motivo u observación del traslado (opcional).',
		example: 'Pase a la Escuela Nº 12',
	})
	reason?: string;
}
