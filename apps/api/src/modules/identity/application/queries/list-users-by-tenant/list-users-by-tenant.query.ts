import { Roles } from '@repo/common';

export class ListUsersByTenantQuery {
	constructor(
		readonly tenantId: string,
		readonly page: number,
		readonly limit: number,
		readonly role?: Roles,
	) {}
}
