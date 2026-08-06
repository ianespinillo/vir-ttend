export const APP_ROUTES = {
	login: '/login',
	selectTenant: '/select-tenant',
	dashboard: '/dashboard',
	students: '/students',
	courses: '/courses',
	attendanceDaily: '/attendance/daily',
	attendanceSubject: '/attendance/subject',
	alerts: '/alerts',
	reports: '/reports',
	announcements: '/announcements',
	tenants: '/tenants',
	users: '/users',
	settings: '/settings',
	profile: '/settings/profile',
} as const;

export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];
