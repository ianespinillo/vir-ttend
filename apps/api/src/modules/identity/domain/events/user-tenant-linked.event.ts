import { Roles } from '@repo/common';

export class UserTenantLinkedEvent {
	readonly ocurredAt: Date;
	constructor(
		readonly userId: string,
		readonly email: string,
		readonly tenantId: string,
		readonly role: Roles,
		readonly tenantName: string,
	) {
		this.ocurredAt = new Date();
	}
}
