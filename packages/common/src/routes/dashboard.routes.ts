export const DASHBOARD_ROUTES = {
	dashboard: '/dashboard',
	dashboardCourse: (courseId: string) => `/dashboard/course/${courseId}`,
	dashboardMetrics: '/dashboard/metrics',
} as const;
