import { Roles } from '@repo/common';

export class JustifyWorkshopAttendanceCommand {
	constructor(
		readonly tenantId: string,
		readonly userId: string,
		readonly role: Roles,
		readonly workshopAttendanceRecordId: string,
		readonly reason: string,
		readonly notes?: string,
	) {}
}
