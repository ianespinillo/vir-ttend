import { Roles } from '@repo/common';

export class ListUsersByTenantQuery {
	constructor(
		readonly tenantId: string | undefined,
		readonly page: number,
		readonly limit: number,
		readonly role?: Roles,
		readonly search?: string,
	) {}
}
