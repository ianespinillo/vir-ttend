import { Roles } from '@repo/common';

export class ChangeMembershipRoleCommand {
	constructor(
		readonly userId: string,
		readonly tenantId: string,
		readonly newRole: Roles,
		readonly actorRole: Roles,
	) {}
}
