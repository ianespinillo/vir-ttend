import type { Roles } from '../../constants/roles.enum.js';

export interface CurrentUser {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: Roles;
	tenantId: string;
	mustChangePassword: boolean;
}
