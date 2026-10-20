import { Roles } from '@repo/common';

export class GetSubjectStudentsQuery {
	constructor(
		readonly subjectId: string,
		readonly tenantId: string,
		readonly requesterId: string,
		readonly requesterRole: Roles,
		/**
		 * Class date: a workshop subject with mixed slots lists the commission of
		 * that weekday. Without it, every commission the subject targets.
		 */
		readonly date?: Date,
	) {}
}
