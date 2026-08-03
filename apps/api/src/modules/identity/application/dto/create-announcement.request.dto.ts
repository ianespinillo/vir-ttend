import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsDate,
	IsIn,
	IsNotEmpty,
	IsOptional,
	IsString,
} from 'class-validator';
import { AnnouncementTargetType } from '../../domain/value-objects/announcement-target.value-object';

export class CreateAnnouncementRequestDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({
		description: 'Título del comunicado.',
		example: 'Reunión de padres',
	})
	title!: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({
		description: 'Cuerpo del comunicado.',
		example: 'Se convoca a los padres a la reunión de inicio de ciclo lectivo.',
	})
	body!: string;

	@IsIn(['school', 'course', 'level'])
	@ApiProperty({
		description:
			"Tipo de audiencia al que está dirigido: 'school' (toda la escuela), 'course' (un curso) o 'level' (un nivel).",
		enum: ['school', 'course', 'level'],
		example: 'course',
	})
	targetType!: AnnouncementTargetType;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional({
		description:
			"Identificador del curso o nivel al que apunta el comunicado. Obligatorio cuando targetType es course o level; se omite cuando es school. Para level debe ser 'primary' o 'secondary'.",
		example: '3f0b7f44-8c2a-4d1e-9b5a-1c2d3e4f5a6b',
	})
	targetId?: string;

	@IsOptional()
	@IsDate()
	@ApiPropertyOptional({
		description:
			'Fecha programada de publicación. Si se omite o es null, el comunicado se publica de inmediato (status published); si tiene fecha futura, queda en borrador (status draft).',
		type: String,
		format: 'date-time',
		example: '2026-08-10T18:00:00.000Z',
	})
	publishAt?: Date;
}
