import { AttendanceStatus } from '@repo/common';

export class BulkUpdateSubjectStatusCommand {
	constructor(
		readonly userId: string,
		readonly tenantId: string,
		readonly subjectId: string,
		readonly date: Date,
		readonly status: AttendanceStatus,
	) {}
}
