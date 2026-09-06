import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CopyDailyAttendanceRequestDto {
	@IsString()
	@ApiProperty({
		description: 'Identificador del curso cuya asistencia se copia',
		example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
	})
	courseId!: string;

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
			'Fecha origen desde la que se copia la asistencia. Si se omite, se usa la última fecha con registros.',
		example: '2026-03-10',
	})
	sourceDate?: string;
}
