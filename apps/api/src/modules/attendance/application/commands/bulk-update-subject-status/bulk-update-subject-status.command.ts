import { AttendanceStatus, Roles } from '@repo/common';

export class BulkUpdateSubjectStatusCommand {
	constructor(
		readonly userId: string,
		readonly userRole: Roles,
		readonly tenantId: string,
		readonly subjectId: string,
		readonly date: Date,
		readonly status: AttendanceStatus,
	) {}
}
