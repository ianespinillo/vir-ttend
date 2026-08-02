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
import { AnnouncementTarget } from '../../../domain/value-objects/announcement-target.value-object';
import { AnnouncementDtoMapper } from '../../dto/announcement-dto.mapper';
import { AnnouncementResponseDto } from '../../dto/announcement.response.dto';
import { UpdateAnnouncementCommand } from './update-announcement.command';

@Injectable()
export class UpdateAnnouncementHandler {
	constructor(
		@Inject('IAnnouncementRepository')
		private readonly announcementRepo: IAnnouncementRepository,
		@Inject('IUserRepository')
		private readonly userRepo: IUserRepository,
	) {}

	async execute(
		command: UpdateAnnouncementCommand,
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
				'Solo el autor o un admin pueden editar este comunicado',
			);
		}
		if (announcement.status !== 'draft') {
			throw new BadRequestException(
				'Solo se pueden editar comunicados en borrador',
			);
		}

		announcement.update({
			title: command.title,
			body: command.body,
			target:
				command.targetType !== undefined
					? new AnnouncementTarget(command.targetType, command.targetId ?? '')
					: undefined,
		});
		await this.announcementRepo.save(announcement);

		const author = await this.userRepo.findById(announcement.authorId);
		return AnnouncementDtoMapper.toResponse(
			announcement,
			author?.fullName ?? 'Desconocido',
		);
	}
}
