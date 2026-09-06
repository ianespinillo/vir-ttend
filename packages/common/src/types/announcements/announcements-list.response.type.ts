import type { Announcement } from './announcement.response.type.js';

export interface AnnouncementsListResponse {
	items: Announcement[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface CreateAnnouncementPayload {
	title: string;
	body: string;
	targetType: 'school' | 'course' | 'level';
	targetId?: string;
	publishAt?: string | null;
}

export interface UpdateAnnouncementPayload {
	title?: string;
	body?: string;
	targetType?: 'school' | 'course' | 'level';
	targetId?: string;
}
