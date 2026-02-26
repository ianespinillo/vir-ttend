import { Roles } from '../constants/roles.enum.js';

// interfaces/user.interface.ts
export interface IUserResponse {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: Roles;
	tenantId: string;
	mustChangePassword: boolean;
}

export interface ITenantOption {
	tenantId: string;
	tenantName: string;
	role: Roles;
}

export interface ILoginResponse {
	tenants: ITenantOption[];
	userId: string;
	isSuperAdmin: boolean;
}
