import { AttendanceStatus, Roles } from '@repo/common';

export class BulkRegisterWorkshopAttendanceCommand {
	constructor(
		readonly tenantId: string,
		readonly userId: string,
		readonly role: Roles,
		readonly commissionId: string,
		readonly date: Date,
		readonly status: AttendanceStatus,
	) {}
}
