import { Roles } from '@repo/common';

export class GetSubjectHistoryQuery {
	constructor(
		readonly subjectId: string,
		readonly from: Date,
		readonly to: Date,
		readonly userId: string,
		readonly userRole: Roles,
		readonly tenantId: string,
	) {}
}
