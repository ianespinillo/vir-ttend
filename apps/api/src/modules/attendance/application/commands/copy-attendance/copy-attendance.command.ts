import { Roles } from '@repo/common';

export class CopyAttendanceCommand {
	constructor(
		readonly userId: string,
		readonly userRole: Roles,
		readonly subjectId: string,
		readonly targetDate: Date,
		readonly sourceDate?: Date,
	) {}
}
