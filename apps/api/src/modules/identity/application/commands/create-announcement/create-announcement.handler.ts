import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Announcement } from '../../../domain/entities/announcement.entity';
import { IAnnouncementRepository } from '../../../domain/repositories/announcement.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import {
	AnnouncementTarget,
	AnnouncementTargetType,
} from '../../../domain/value-objects/announcement-target.value-object';
import { AnnouncementDtoMapper } from '../../dto/announcement-dto.mapper';
import { AnnouncementResponseDto } from '../../dto/announcement.response.dto';
import { CreateAnnouncementCommand } from './create-announcement.command';

@Injectable()
export class CreateAnnouncementHandler {
	constructor(
		@Inject('IAnnouncementRepository')
		private readonly announcementRepo: IAnnouncementRepository,
		@Inject('IUserRepository')
		private readonly userRepo: IUserRepository,
	) {}

	async execute(
		command: CreateAnnouncementCommand,
	): Promise<AnnouncementResponseDto> {
		const target = new AnnouncementTarget(
			command.targetType as AnnouncementTargetType,
			command.targetId ?? '',
		);
		const announcement = Announcement.create({
			schoolId: command.schoolId,
			tenantId: command.schoolId,
			authorId: command.authorId,
			title: command.title,
			body: command.body,
			target,
			publishAt: command.publishAt ?? null,
		});
		await this.announcementRepo.save(announcement);
		const author = await this.userRepo.findById(command.authorId);
		return AnnouncementDtoMapper.toResponse(
			announcement,
			author?.fullName ?? 'Desconocido',
		);
	}
}
