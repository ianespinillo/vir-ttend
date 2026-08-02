import { AnnouncementTargetType } from '../../../domain/value-objects/announcement-target.value-object';

export class CreateAnnouncementCommand {
	constructor(
		readonly schoolId: string,
		readonly authorId: string,
		readonly title: string,
		readonly body: string,
		readonly targetType: AnnouncementTargetType,
		readonly targetId?: string,
		readonly publishAt?: Date | null,
	) {}
}
