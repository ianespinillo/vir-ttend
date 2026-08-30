import { Roles } from '@repo/common';
export class CreateMembershipCommand {
	constructor(
		readonly userEmail: string,
		readonly tenantId: string,
		readonly role: Roles,
	) {}
}
