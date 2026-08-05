export const queryKeys = {
	auth: { me: ['auth', 'me'] },
	tenants: { all: ['tenants'] },
	academicYears: { all: ['academic-years'] },
	courses: {
		list: (filters?: Record<string, unknown>) => [
			'courses',
			'list',
			filters ?? {},
		],
		detail: (id: string) => ['courses', 'detail', id],
	},
	students: {
		list: (filters?: Record<string, unknown>) => [
			'students',
			'list',
			filters ?? {},
		],
		detail: (id: string) => ['students', 'detail', id],
	},
	attendance: {
		daily: (courseId: string, date: string) => [
			'attendance',
			'daily',
			courseId,
			date,
		],
	},
	alerts: { count: ['alerts', 'count'], unseen: ['alerts', 'unseen'] },
	reports: {
		monthly: (courseId: string, month: number, year: number) => [
			'reports',
			'monthly',
			courseId,
			month,
			year,
		],
	},
	announcements: {
		all: (filters?: Record<string, unknown>) => [
			'announcements',
			'list',
			filters ?? {},
		],
		forMe: ['announcements', 'for-me'],
	},
} as const;
