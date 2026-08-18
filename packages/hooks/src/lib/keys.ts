export const queryKeys = {
	auth: {
		me: ['auth', 'me'] as const,
	},
	tenants: {
		all: (filters?: Record<string, unknown>) =>
			['tenants', 'list', filters ?? {}] as const,
		detail: (id: string) => ['tenants', 'detail', id] as const,
	},
	academicYears: {
		all: ['academic-years', 'list'] as const,
		active: ['academic-years', 'active'] as const,
		detail: (id: string) => ['academic-years', 'detail', id] as const,
	},
	courses: {
		list: (filters?: Record<string, unknown>) =>
			['courses', 'list', filters ?? {}] as const,
		my: (academicYearId?: string) =>
			['courses', 'my', academicYearId ?? 'none'] as const,
		detail: (id: string) => ['courses', 'detail', id] as const,
	},
	subjects: {
		list: (courseId: string) => ['subjects', 'list', courseId] as const,
		teacher: (teacherId: string, academicYearId?: string) =>
			['subjects', 'teacher', teacherId, academicYearId ?? 'active'] as const,
	},
	schedule: {
		byCourse: (courseId: string) => ['schedule', 'course', courseId] as const,
	},
	students: {
		list: (filters?: Record<string, unknown>) =>
			['students', 'list', filters ?? {}] as const,
		detail: (id: string) => ['students', 'detail', id] as const,
		search: (q: string) => ['students', 'search', q] as const,
	},
	users: {
		list: (filters?: Record<string, unknown>) =>
			['users', 'list', filters ?? {}] as const,
	},
	attendance: {
		daily: (courseId: string, date: string) =>
			['attendance', 'daily', courseId, date] as const,
		metrics: (courseId: string, date: string) =>
			['attendance', 'metrics', courseId, date] as const,
		byStudent: (studentId: string, from?: string, to?: string) =>
			['attendance', 'student', studentId, { from, to }] as const,
		history: (courseId: string, from?: string, to?: string) =>
			['attendance', 'history', courseId, { from, to }] as const,
		subject: (subjectId: string, date: string) =>
			['attendance', 'subject', subjectId, date] as const,
		subjectHistory: (subjectId: string, from?: string, to?: string) =>
			['attendance', 'subject-history', subjectId, { from, to }] as const,
	},
	alerts: {
		list: (filters?: Record<string, unknown>) =>
			['alerts', 'list', filters ?? {}] as const,
		unseen: ['alerts', 'unseen'] as const,
		count: ['alerts', 'count'] as const,
		byStudent: (studentId: string, academicYearId: string) =>
			['alerts', 'student', studentId, academicYearId] as const,
	},
	reports: {
		monthly: (courseId: string, month: number, year: number) =>
			['reports', 'monthly', courseId, month, year] as const,
		courseSummary: (courseId: string, academicYearId: string) =>
			['reports', 'summary', courseId, academicYearId] as const,
		available: (courseId: string) => ['reports', 'available', courseId] as const,
		byStudent: (studentId: string, academicYearId: string) =>
			['reports', 'student', studentId, academicYearId] as const,
	},
	announcements: {
		list: (filters?: Record<string, unknown>) =>
			['announcements', 'list', filters ?? {}] as const,
		forMe: ['announcements', 'for-me'] as const,
		detail: (id: string) => ['announcements', 'detail', id] as const,
	},
	dashboard: {
		preceptor: (date: string) => ['dashboard', 'preceptor', date] as const,
		course: (courseId: string, date: string) =>
			['dashboard', 'course', courseId, date] as const,
		metrics: (academicYearId: string) =>
			['dashboard', 'metrics', academicYearId] as const,
	},
} as const;
