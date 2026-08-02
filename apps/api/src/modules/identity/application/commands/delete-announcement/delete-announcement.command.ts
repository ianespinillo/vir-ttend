import { Roles } from '@repo/common';

export class DeleteAnnouncementCommand {
	constructor(
		readonly announcementId: string,
		readonly schoolId: string,
		readonly actorRole: Roles,
	) {}
}
