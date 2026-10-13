import { Roles } from '@repo/common';

export class DeactivateMembershipCommand {
	constructor(
		readonly userId: string,
		readonly tenantId: string,
		readonly actorRole: Roles,
		readonly actorUserId: string,
		readonly email?: string,
	) {}
}
