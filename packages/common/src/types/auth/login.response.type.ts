import type { TenantOption } from './tenant-option.type.js';

export interface LoginResponse {
	isSuperAdmin: boolean;
	userId: string;
	tenants: TenantOption[];
}
