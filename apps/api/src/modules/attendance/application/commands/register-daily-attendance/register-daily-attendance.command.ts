import { AttendanceStatus } from '@repo/common';

export class RegisterDailyAttendanceCommand {
	constructor(
		readonly tenantId: string,
		readonly courseId: string,
		readonly date: Date,
		readonly records: { studentId: string; status: AttendanceStatus }[],
		readonly editedBy: string,
	) {}
}
