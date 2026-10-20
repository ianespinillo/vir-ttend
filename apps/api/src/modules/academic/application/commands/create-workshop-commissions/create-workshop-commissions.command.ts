import { CommissionCount, DEFAULT_COMMISSION_COUNT } from '@repo/common';

export class CreateWorkshopCommissionsCommand {
	constructor(
		readonly courseId: string,
		readonly tenantId: string,
		/** 1 puts every active student in commission 1; 2 splits them 50/50. */
		readonly count: CommissionCount = DEFAULT_COMMISSION_COUNT,
		readonly actorId?: string,
		readonly actorRole?: string,
	) {}
}
