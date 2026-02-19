export const ATTENDANCE_ROUTES = {
	daily: '/attendance/daily',
	dailyAll: '/attendance/daily/all',
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
	dashboard: '/dashboard',
	dashboardCourse: (courseId: string) => `/dashboard/course/${courseId}`,
	dashboardMetrics: '/dashboard/metrics',
} as const;
