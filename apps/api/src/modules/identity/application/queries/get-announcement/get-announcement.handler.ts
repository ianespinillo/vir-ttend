import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IAnnouncementRepository } from '../../../domain/repositories/announcement.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { AnnouncementDtoMapper } from '../../dto/announcement-dto.mapper';
import { AnnouncementResponseDto } from '../../dto/announcement.response.dto';
import { GetAnnouncementQuery } from './get-announcement.query';

@Injectable()
export class GetAnnouncementHandler {
	constructor(
		@Inject('IAnnouncementRepository')
		private readonly announcementRepo: IAnnouncementRepository,
		@Inject('IUserRepository')
		private readonly userRepo: IUserRepository,
	) {}

	async execute(query: GetAnnouncementQuery): Promise<AnnouncementResponseDto> {
		const announcement = await this.announcementRepo.findById(
			query.announcementId,
		);
		if (!announcement || announcement.schoolId !== query.schoolId) {
			throw new NotFoundException('Announcement not found');
		}
		const author = await this.userRepo.findById(announcement.authorId);
		return AnnouncementDtoMapper.toResponse(
			announcement,
			author?.fullName ?? 'Desconocido',
		);
	}
}
