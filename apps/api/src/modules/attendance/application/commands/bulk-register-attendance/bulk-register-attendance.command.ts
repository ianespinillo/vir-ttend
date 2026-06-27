import { AttendanceStatus } from '@repo/common';

export class BulkRegisterAttendanceCommand {
	constructor(
		readonly tenantId: string,
		readonly courseId: string,
		readonly date: Date,
		readonly defaultStatus: AttendanceStatus,
		readonly editedBy: string,
	) {}
}
