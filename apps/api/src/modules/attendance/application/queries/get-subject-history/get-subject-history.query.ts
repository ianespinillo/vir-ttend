import { ROLES, Roles } from '@repo/common';

export class GetSubjectHistoryQuery {
	constructor(
		readonly subjectId: string,
		readonly from: Date,
		readonly to: Date,
		readonly userId = '',
		readonly userRole: Roles = ROLES.ADMIN,
		readonly tenantId = '',
	) {}
}
