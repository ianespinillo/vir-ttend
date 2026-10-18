export const USER_ROUTES = {
	users: '/users',
	me: '/users/me',
	myTenants: '/users/me/tenants',
	user: (id: string) => `/users/${id}`,
	changeRole: (id: string) => `/users/${id}/role`,
	changePassword: '/users/me/password',
} as const;
