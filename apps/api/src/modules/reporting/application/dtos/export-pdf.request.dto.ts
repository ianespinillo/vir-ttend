import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsIn,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Max,
	Min,
} from 'class-validator';

export class ExportPdfRequestDto {
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

	@IsOptional()
	@IsIn(['monthly', 'student'])
	@ApiPropertyOptional({
		description:
			'Tipo de reporte a exportar: mensual del curso o de un estudiante',
		enum: ['monthly', 'student'],
		example: 'monthly',
		default: 'monthly',
	})
	type: 'monthly' | 'student' = 'monthly';

	@IsOptional()
	@IsString()
	@ApiPropertyOptional({
		description:
			'Identificador del estudiante (UUID). Obligatorio si type = student',
		example: 'b7d2e4f1-8a3c-4d5e-9f6a-2c1b0d3e5f7a',
	})
	studentId?: string;
}
