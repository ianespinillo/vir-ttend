import { Roles } from '../constants/roles.enum.js';

export interface JwtPayload {
	sub: string; // Subject (user ID)
	tenantId: string; // Tenant ID
	role: Roles; // User role
	email: string; // User email
	isImpersonating?: boolean; // Whether user is a Superadmin impersonating a tenant
	iat?: number; // Issued at timestamp
	exp?: number; // Expiration timestamp
}
