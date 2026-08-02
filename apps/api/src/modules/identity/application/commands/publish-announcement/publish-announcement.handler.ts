import {
	BadRequestException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { ROLES } from '@repo/common';
import { IAnnouncementRepository } from '../../../domain/repositories/announcement.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { AnnouncementDtoMapper } from '../../dto/announcement-dto.mapper';
import { AnnouncementResponseDto } from '../../dto/announcement.response.dto';
import { PublishAnnouncementCommand } from './publish-announcement.command';

@Injectable()
export class PublishAnnouncementHandler {
	constructor(
		@Inject('IAnnouncementRepository')
		private readonly announcementRepo: IAnnouncementRepository,
		@Inject('IUserRepository')
		private readonly userRepo: IUserRepository,
	) {}

	async execute(
		command: PublishAnnouncementCommand,
	): Promise<AnnouncementResponseDto> {
		const announcement = await this.announcementRepo.findById(
			command.announcementId,
		);
		if (!announcement || announcement.schoolId !== command.schoolId) {
			throw new NotFoundException('Announcement not found');
		}
		if (
			command.actorRole !== ROLES.ADMIN &&
			announcement.authorId !== command.actorId
		) {
			throw new ForbiddenException(
				'Solo el autor o un admin pueden publicar este comunicado',
			);
		}
		if (announcement.status !== 'draft') {
			throw new BadRequestException(
				'Solo se pueden publicar comunicados en borrador',
			);
		}

		announcement.publish();
		await this.announcementRepo.save(announcement);

		const author = await this.userRepo.findById(announcement.authorId);
		return AnnouncementDtoMapper.toResponse(
			announcement,
			author?.fullName ?? 'Desconocido',
		);
	}
}
