import { AttendanceStatus } from '@repo/common';

export class RegisterSubjectAttendanceCommand {
	constructor(
		readonly tenantId: string,
		readonly userId: string,
		readonly subjectId: string,
		readonly courseId: string,
		readonly date: Date,
		readonly records: { studentId: string; status: AttendanceStatus }[],
	) {}
}
