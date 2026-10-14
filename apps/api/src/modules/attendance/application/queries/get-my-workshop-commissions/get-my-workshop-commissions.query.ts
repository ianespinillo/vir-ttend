import { Roles } from '@repo/common';

export class GetMyWorkshopCommissionsQuery {
	constructor(
		readonly tenantId: string,
		readonly userId: string,
		readonly role: Roles,
		readonly date: Date,
	) {}
}
