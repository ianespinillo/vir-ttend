export const USER_ROUTES = {
	users: '/users',
	me: '/users/me',
	changeRole: (id: string) => `/users/${id}/role`,
} as const;
