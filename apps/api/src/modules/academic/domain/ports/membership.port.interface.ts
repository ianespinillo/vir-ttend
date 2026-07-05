import { Roles } from '@repo/common';

export interface IMembershipPort {
	existsAndHasRole(
		userId: string,
		tenantId: string,
		role: Roles,
	): Promise<boolean>;
	belongsToTenant(userId: string, tenantId: string): Promise<boolean>;
}
