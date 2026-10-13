import { AttendanceStatus, Roles } from '@repo/common';

export class RegisterSubjectAttendanceCommand {
	constructor(
		readonly tenantId: string,
		readonly userId: string,
		readonly userRole: Roles,
		readonly subjectId: string,
		readonly courseId: string,
		readonly date: Date,
		readonly records: { studentId: string; status: AttendanceStatus }[],
	) {}
}
