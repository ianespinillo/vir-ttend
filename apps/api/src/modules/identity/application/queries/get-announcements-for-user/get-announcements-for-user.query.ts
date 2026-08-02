import { LevelType } from '@repo/common';

export class GetAnnouncementsForUserQuery {
	constructor(
		readonly userId: string,
		readonly schoolId: string,
		readonly courseId?: string,
		readonly level?: LevelType,
	) {}
}
