import { AnnouncementStatus } from '../../../domain/entities/announcement.entity';
import { AnnouncementTargetType } from '../../../domain/value-objects/announcement-target.value-object';

export class GetAnnouncementsQuery {
	constructor(
		readonly schoolId: string,
		readonly targetType?: AnnouncementTargetType,
		readonly status?: AnnouncementStatus,
		readonly page = 1,
		readonly limit = 20,
	) {}
}
