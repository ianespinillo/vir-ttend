export const ATTENDANCE_ROUTES = {
	daily: '/attendance/daily',
	dailyAll: '/attendance/daily/all',
	dailyCopy: '/attendance/daily/copy',
	subject: '/attendance/subject',
	subjectAll: '/attendance/subject/all',
	subjectCopy: '/attendance/subject/copy',
	subjectHistory: (subjectId: string) =>
		`/attendance/subject/${subjectId}/history`,
	justify: (id: string) => `/attendance/${id}/justify`,
	metrics: '/attendance/metrics',
	history: '/attendance/history',
	byStudent: (studentId: string) => `/attendance/student/${studentId}`,
	teacherSubjects: '/attendance/teacher/subjects',
	workshop: '/attendance/workshop',
	workshopAll: '/attendance/workshop/all',
	workshopMyCommissions: '/attendance/workshop/my-commissions',
} as const;
