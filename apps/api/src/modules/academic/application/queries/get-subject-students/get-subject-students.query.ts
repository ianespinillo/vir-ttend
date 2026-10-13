import { Roles } from '@repo/common';

export class GetSubjectStudentsQuery {
	constructor(
		readonly subjectId: string,
		readonly tenantId: string,
		readonly requesterId: string,
		readonly requesterRole: Roles,
	) {}
}
