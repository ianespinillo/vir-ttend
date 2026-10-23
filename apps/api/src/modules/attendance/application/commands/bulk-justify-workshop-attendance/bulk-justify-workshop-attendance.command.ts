import { Roles } from '@repo/common';

export class BulkJustifyWorkshopAttendanceCommand {
	constructor(
		readonly tenantId: string,
		readonly userId: string,
		readonly role: Roles,
		readonly recordIds: string[],
		readonly reason: string,
		readonly notes?: string,
	) {}
}
