import { Roles } from '@repo/common';

export class UnmarkWorkshopSessionNotHeldCommand {
	constructor(
		readonly tenantId: string,
		readonly userId: string,
		readonly role: Roles,
		readonly commissionId: string,
		readonly date: Date,
	) {}
}
