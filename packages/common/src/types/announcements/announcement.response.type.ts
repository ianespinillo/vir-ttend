export type AnnouncementStatus = 'draft' | 'published';

export type AnnouncementTargetType = 'school' | 'course' | 'level';

export interface Announcement {
	id: string;
	title: string;
	body: string;
	targetType: AnnouncementTargetType;
	targetId: string;
	status: AnnouncementStatus;
	publishAt: Date | null;
	authorName: string;
	createdAt: Date;
}
