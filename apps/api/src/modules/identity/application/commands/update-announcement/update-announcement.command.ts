import { Roles } from '@repo/common';
import { AnnouncementTargetType } from '../../../domain/value-objects/announcement-target.value-object';

export class UpdateAnnouncementCommand {
	constructor(
		readonly announcementId: string,
		readonly schoolId: string,
		readonly actorId: string,
		readonly actorRole: Roles,
		readonly title?: string,
		readonly body?: string,
		readonly targetType?: AnnouncementTargetType,
		readonly targetId?: string,
	) {}
}
