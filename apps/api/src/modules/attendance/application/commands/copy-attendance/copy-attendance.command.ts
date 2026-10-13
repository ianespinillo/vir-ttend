import { Roles } from '@repo/common';

export class CopyAttendanceCommand {
	constructor(
		readonly userId: string,
		readonly userRole: Roles,
		readonly tenantId: string,
		readonly subjectId: string,
		readonly targetDate: Date,
		readonly sourceDate?: Date,
	) {}
}
