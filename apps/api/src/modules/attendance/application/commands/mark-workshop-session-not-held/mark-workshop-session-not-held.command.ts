import { Roles } from '@repo/common';

export class MarkWorkshopSessionNotHeldCommand {
	constructor(
		readonly tenantId: string,
		readonly userId: string,
		readonly role: Roles,
		readonly commissionId: string,
		readonly date: Date,
		readonly reason: string | undefined,
	) {}
}
