import type { Roles } from '../../constants/roles.enum.js';

export interface TenantOption {
	tenantId: string;
	tenantName: string;
	role: Roles;
}
