import { Inject, Injectable } from '@nestjs/common';
import { Announcement } from '../../../domain/entities/announcement.entity';
import { IAnnouncementRepository } from '../../../domain/repositories/announcement.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { AnnouncementDtoMapper } from '../../dto/announcement-dto.mapper';
import { AnnouncementResponseDto } from '../../dto/announcement.response.dto';
import { GetAnnouncementsForUserQuery } from './get-announcements-for-user.query';

const normalizeLevelKey = (level: string): string =>
	level.toLowerCase().replace('seondary', 'secondary');

const isRelevant = (
	announcement: Announcement,
	courseId?: string,
	level?: string,
): boolean => {
	switch (announcement.target.type) {
		case 'school':
			return true;
		case 'course':
			return courseId !== undefined && announcement.target.id === courseId;
		case 'level':
			return (
				level !== undefined &&
				normalizeLevelKey(announcement.target.id) === normalizeLevelKey(level)
			);
		default:
			return false;
	}
};

@Injectable()
export class GetAnnouncementsForUserHandler {
	constructor(
		@Inject('IAnnouncementRepository')
		private readonly announcementRepo: IAnnouncementRepository,
		@Inject('IUserRepository')
		private readonly userRepo: IUserRepository,
	) {}

	async execute(
		query: GetAnnouncementsForUserQuery,
	): Promise<AnnouncementResponseDto[]> {
		const published = await this.announcementRepo.findBySchool(query.schoolId, {
			status: 'published',
			limit: 100,
			page: 1,
		});
		const relevant = published.filter((a) =>
			isRelevant(a, query.courseId, query.level),
		);
		return AnnouncementDtoMapper.toResponseList(this.userRepo, relevant);
	}
}
