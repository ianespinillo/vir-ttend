export const ATTENDANCE_ROUTES = {
	daily: '/attendance/daily',
	dailyAll: '/attendance/daily/all',
	dailyCopy: '/attendance/daily/copy',
	dailyNotHeld: '/attendance/daily/not-held',
	subject: '/attendance/subject',
	subjectAll: '/attendance/subject/all',
	subjectCopy: '/attendance/subject/copy',
	subjectHistory: (subjectId: string) =>
		`/attendance/subject/${subjectId}/history`,
	justify: (id: string) => `/attendance/${id}/justify`,
	justifyBulk: '/attendance/justify/bulk',
	metrics: '/attendance/metrics',
	history: '/attendance/history',
	byStudent: (studentId: string) => `/attendance/student/${studentId}`,
	teacherSubjects: '/attendance/teacher/subjects',
	workshop: '/attendance/workshop',
	workshopAll: '/attendance/workshop/all',
	workshopJustify: (recordId: string) =>
		`/attendance/workshop/records/${recordId}/justify`,
	workshopJustifyBulk: '/attendance/workshop/records/justify/bulk',
	workshopMyCommissions: '/attendance/workshop/my-commissions',
} as const;
