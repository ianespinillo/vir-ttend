export const ANNOUNCEMENT_ROUTES = {
	announcements: '/announcements',
	forMe: '/announcements/for-me',
	announcement: (id: string) => `/announcements/${id}`,
	publish: (id: string) => `/announcements/${id}/publish`,
} as const;
