import { Roles } from '@repo/common';

export class GetSubjectAttendanceQuery {
	constructor(
		readonly subjectId: string,
		readonly date: Date,
		readonly userId: string,
		readonly userRole: Roles,
	) {}
}
