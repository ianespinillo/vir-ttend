import { CommissionNumber } from '@repo/common';

export class AssignTeacherCommand {
	constructor(
		readonly subjectId: string,
		readonly teacherId: string,
		readonly tenantId: string,
		/** Workshop commission the teacher covers; absent = the whole subject. */
		readonly commissionNumber?: CommissionNumber | null,
	) {}
}
