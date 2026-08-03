import { ApiProperty } from '@nestjs/swagger';
import { AnnouncementResponseDto } from './announcement.response.dto';

export class AnnouncementsListResponseDto {
	constructor(
		@(
			ApiProperty({
				description: 'Comunicados de la página actual.',
				type: [AnnouncementResponseDto],
				example: [
					{
						id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
						title: 'Comunicado de fin de trimestre',
						body:
							'Se informa a toda la comunidad que el cierre de notas será el próximo viernes.',
						targetType: 'course',
						targetId: '3f0b7f44-8c2a-4d1e-9b5a-1c2d3e4f5a6b',
						status: 'published',
						publishAt: '2026-08-15T08:00:00.000Z',
						authorName: 'María González',
						createdAt: '2026-07-30T14:23:11.000Z',
					},
				],
			}) as ParameterDecorator
		)
		readonly items: AnnouncementResponseDto[],
		@(
			ApiProperty({
				description: 'Cantidad total de comunicados (sin paginar).',
				example: 42,
			}) as ParameterDecorator
		)
		readonly total: number,
		@(
			ApiProperty({
				description: 'Página actual de la paginación.',
				example: 1,
			}) as ParameterDecorator
		)
		readonly page: number,
	) {}
}
