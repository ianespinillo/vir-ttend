import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnnouncementStatus } from '../../domain/entities/announcement.entity';
import { AnnouncementTargetType } from '../../domain/value-objects/announcement-target.value-object';

export class AnnouncementResponseDto {
	constructor(
		@(
			ApiProperty({
				description: 'Identificador único del comunicado (UUID v4).',
				example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
			}) as ParameterDecorator
		)
		readonly id: string,
		@(
			ApiProperty({
				description: 'Título del comunicado.',
				example: 'Comunicado de fin de trimestre',
			}) as ParameterDecorator
		)
		readonly title: string,
		@(
			ApiProperty({
				description: 'Cuerpo del comunicado.',
				example:
					'Se informa a toda la comunidad que el cierre de notas será el próximo viernes.',
			}) as ParameterDecorator
		)
		readonly body: string,
		@(
			ApiProperty({
				description:
					"Tipo de audiencia al que está dirigido: 'school' (toda la escuela), 'course' (un curso) o 'level' (un nivel).",
				enum: ['school', 'course', 'level'],
				example: 'course',
			}) as ParameterDecorator
		)
		readonly targetType: AnnouncementTargetType,
		@(
			ApiProperty({
				description:
					"Identificador del curso o nivel al que apunta. Vacío ('') cuando el targetType es school.",
				example: '3f0b7f44-8c2a-4d1e-9b5a-1c2d3e4f5a6b',
			}) as ParameterDecorator
		)
		readonly targetId: string,
		@(
			ApiProperty({
				description:
					'Estado del comunicado: draft (borrador) o published (publicado).',
				enum: ['draft', 'published'],
				example: 'published',
			}) as ParameterDecorator
		)
		readonly status: AnnouncementStatus,
		@(
			ApiPropertyOptional({
				description:
					'Fecha programada de publicación. null cuando el comunicado se publica de inmediato.',
				type: String,
				format: 'date-time',
				example: '2026-08-15T08:00:00.000Z',
			}) as ParameterDecorator
		)
		readonly publishAt: Date | null,
		@(
			ApiProperty({
				description: 'Nombre completo del autor del comunicado.',
				example: 'María González',
			}) as ParameterDecorator
		)
		readonly authorName: string,
		@(
			ApiProperty({
				description: 'Fecha de creación del comunicado.',
				type: String,
				format: 'date-time',
				example: '2026-07-30T14:23:11.000Z',
			}) as ParameterDecorator
		)
		readonly createdAt: Date,
	) {}
}
