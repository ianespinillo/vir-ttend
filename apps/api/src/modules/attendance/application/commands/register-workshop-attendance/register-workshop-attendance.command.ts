import { AttendanceStatus, Roles } from '@repo/common';

export class RegisterWorkshopAttendanceCommand {
	constructor(
		readonly tenantId: string,
		readonly userId: string,
		readonly role: Roles,
		readonly commissionId: string,
		readonly date: Date,
		readonly records: { studentId: string; status: AttendanceStatus }[],
	) {}
}
