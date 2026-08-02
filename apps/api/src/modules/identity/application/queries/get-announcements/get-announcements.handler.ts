import { Inject, Injectable } from '@nestjs/common';
import { IAnnouncementRepository } from '../../../domain/repositories/announcement.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { AnnouncementDtoMapper } from '../../dto/announcement-dto.mapper';
import { AnnouncementsListResponseDto } from '../../dto/announcements-list.response.dto';
import { GetAnnouncementsQuery } from './get-announcements.query';

@Injectable()
export class GetAnnouncementsHandler {
	constructor(
		@Inject('IAnnouncementRepository')
		private readonly announcementRepo: IAnnouncementRepository,
		@Inject('IUserRepository')
		private readonly userRepo: IUserRepository,
	) {}

	async execute(
		query: GetAnnouncementsQuery,
	): Promise<AnnouncementsListResponseDto> {
		const announcements = await this.announcementRepo.findBySchool(
			query.schoolId,
			{
				status: query.status,
				targetType: query.targetType,
				page: query.page,
				limit: query.limit,
			},
		);
		const total = await this.announcementRepo.countBySchool(
			query.schoolId,
			query.status,
		);
		const items = await AnnouncementDtoMapper.toResponseList(
			this.userRepo,
			announcements,
		);
		return new AnnouncementsListResponseDto(items, total, query.page);
	}
}
