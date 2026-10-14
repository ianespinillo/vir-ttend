import { Roles } from '@repo/common';

export class GetWorkshopCommissionsQuery {
	constructor(
		readonly courseId: string,
		readonly tenantId: string,
		readonly userId: string,
		readonly role: Roles,
	) {}
}
