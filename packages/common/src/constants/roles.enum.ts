export const ROLES = {
	SUPERADMIN: 'superadmin',
	ADMIN: 'admin',
	PRECEPTOR: 'preceptor',
	TEACHER: 'teacher',
} as const;
export type Roles = (typeof ROLES)[keyof typeof ROLES];
