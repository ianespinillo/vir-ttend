import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class GenerateReportRequestDto {
	@IsNotEmpty()
	@IsString()
	@ApiProperty({
		description: 'Identificador único del curso (UUID)',
		example: '6f9b5d2e-8c4a-4f1e-a3d7-0b2e1c9a7f44',
	})
	courseId!: string;

	@IsNotEmpty()
	@IsNumber()
	@Min(1)
	@Max(12)
	@ApiProperty({
		description: 'Mes del reporte (1-12)',
		example: 7,
		minimum: 1,
		maximum: 12,
	})
	month!: number;

	@IsNotEmpty()
	@IsNumber()
	@Min(2020)
	@Max(2100)
	@ApiProperty({
		description: 'Año del reporte',
		example: 2026,
		minimum: 2020,
		maximum: 2100,
	})
	year!: number;
}
