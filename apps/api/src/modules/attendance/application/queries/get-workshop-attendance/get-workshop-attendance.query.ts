import { Roles } from '@repo/common';

export class GetWorkshopAttendanceQuery {
	constructor(
		readonly tenantId: string,
		readonly userId: string,
		readonly role: Roles,
		readonly commissionId: string,
		readonly date: Date,
	) {}
}
