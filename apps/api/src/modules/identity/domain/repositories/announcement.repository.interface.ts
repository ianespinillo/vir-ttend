import { Announcement } from '../entities/announcement.entity';
import { AnnouncementTargetType } from '../value-objects/announcement-target.value-object';

export type AnnouncementStatus = 'draft' | 'published';

export interface AnnouncementFilter {
	status?: AnnouncementStatus;
	targetType?: AnnouncementTargetType;
	page?: number;
	limit?: number;
}

export interface IAnnouncementRepository {
	findById(id: string): Promise<Announcement | null>;
	findBySchool(
		schoolId: string,
		filter?: AnnouncementFilter,
	): Promise<Announcement[]>;
	findByTarget(
		schoolId: string,
		targetType: AnnouncementTargetType,
		targetId: string,
	): Promise<Announcement[]>;
	findByAuthor(authorId: string): Promise<Announcement[]>;
	countBySchool(schoolId: string, status?: AnnouncementStatus): Promise<number>;
	save(announcement: Announcement): Promise<void>;
	delete(id: string): Promise<void>;
}
