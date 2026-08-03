import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CopyAttendanceRequestDto {
	@IsString()
	@ApiProperty({
		description: 'Identificador de la materia cuya asistencia se copia',
		example: '7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f',
	})
	subjectId!: string;

	@IsDateString()
	@ApiProperty({
		description: 'Fecha destino a la que se copia la asistencia',
		example: '2026-03-17',
	})
	targetDate!: string;

	@IsDateString()
	@IsOptional()
	@ApiPropertyOptional({
		description:
			'Fecha origen desde la que se copia la asistencia. Si se omite, se usa la última clase registrada.',
		example: '2026-03-10',
	})
	sourceDate?: string;
}
