import { Roles } from '@repo/common';

export class ToggleUserStatusCommand {
	constructor(
		readonly userId: string,
		readonly tenantId: string | undefined,
		readonly actorRole: Roles,
		readonly isActive: boolean,
	) {}
}
