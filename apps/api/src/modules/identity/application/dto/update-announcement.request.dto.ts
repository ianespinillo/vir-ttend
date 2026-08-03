import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { AnnouncementTargetType } from '../../domain/value-objects/announcement-target.value-object';

export class UpdateAnnouncementRequestDto {
	@IsOptional()
	@IsString()
	@ApiPropertyOptional({
		description: 'Nuevo título del comunicado.',
		example: 'Reunión de padres - confirmado',
	})
	title?: string;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional({
		description: 'Nuevo cuerpo del comunicado.',
		example: 'Se confirma la reunión de inicio de ciclo lectivo el 10/08.',
	})
	body?: string;

	@IsOptional()
	@IsIn(['school', 'course', 'level'])
	@ApiPropertyOptional({
		description: "Nuevo tipo de audiencia: 'school', 'course' o 'level'.",
		enum: ['school', 'course', 'level'],
		example: 'course',
	})
	targetType?: AnnouncementTargetType;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional({
		description:
			"Nuevo identificador del curso o nivel al que apunta. Para level debe ser 'primary' o 'secondary'.",
		example: '3f0b7f44-8c2a-4d1e-9b5a-1c2d3e4f5a6b',
	})
	targetId?: string;
}
