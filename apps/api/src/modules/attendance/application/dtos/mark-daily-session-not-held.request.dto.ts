import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsDateString,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
} from 'class-validator';

export class MarkDailySessionNotHeldRequestDto {
	@IsUUID()
	@ApiProperty({
		description: 'Identificador del curso cuya clase de teoría no se dictó',
		example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
	})
	courseId!: string;

	@IsDateString()
	@ApiProperty({
		description: 'Fecha de la clase no dictada',
		example: '2026-03-10',
	})
	date!: string;

	@IsString()
	@IsOptional()
	@MaxLength(500)
	@ApiPropertyOptional({
		description: 'Motivo por el que no se dictó la clase',
		example: 'Ausencia del docente',
	})
	reason?: string;
}

export class UnmarkDailySessionNotHeldRequestDto {
	@IsUUID()
	@ApiProperty({
		description: 'Identificador del curso',
		example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
	})
	courseId!: string;

	@IsDateString()
	@ApiProperty({
		description: 'Fecha de la clase (YYYY-MM-DD)',
		example: '2026-03-10',
	})
	date!: string;
}

export class GetDailySessionNotHeldRequestDto {
	@IsUUID()
	@ApiProperty({
		description: 'Identificador del curso',
		example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
	})
	courseId!: string;

	@IsDateString()
	@ApiProperty({
		description: 'Fecha de la clase (YYYY-MM-DD)',
		example: '2026-03-10',
	})
	date!: string;
}
