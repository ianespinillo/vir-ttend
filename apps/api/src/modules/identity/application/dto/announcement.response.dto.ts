import { AnnouncementStatus } from '../../domain/entities/announcement.entity';
import { AnnouncementTargetType } from '../../domain/value-objects/announcement-target.value-object';

export class AnnouncementResponseDto {
	constructor(
		readonly id: string,
		readonly title: string,
		readonly body: string,
		readonly targetType: AnnouncementTargetType,
		readonly targetId: string,
		readonly status: AnnouncementStatus,
		readonly publishAt: Date | null,
		readonly authorName: string,
		readonly createdAt: Date,
	) {}
}
