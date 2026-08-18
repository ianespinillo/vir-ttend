import type { Roles } from '../../constants/roles.enum.js';

export interface IUserWithMembershipResponse {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: Roles;
	isActive: boolean;
	createdAt: string;
}
