export const AUTH_ROUTES = {
	login: '/auth/login',
	selectTenant: '/auth/select-tenant',
	exitTenant: '/auth/exit-tenant',
	logout: '/auth/logout',
	refresh: '/auth/refresh',
	forgotPassword: '/auth/forgot-password',
	resetPassword: '/auth/reset-password',
	me: '/users/me',
} as const;
