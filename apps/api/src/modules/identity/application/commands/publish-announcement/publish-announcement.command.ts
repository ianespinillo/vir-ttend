import { Roles } from '@repo/common';

export class PublishAnnouncementCommand {
	constructor(
		readonly announcementId: string,
		readonly schoolId: string,
		readonly actorId: string,
		readonly actorRole: Roles,
	) {}
}
