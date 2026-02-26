import { ITenantOption, Roles } from '@repo/common';

// tenant-option.dto.ts
export class TenantOptionDto implements ITenantOption {
	tenantId!: string;
	tenantName!: string;
	role!: Roles;
}
