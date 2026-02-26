import { Roles } from '@repo/common';

export class UserTenantLinkedEvent {
	readonly ocurredAt: Date;
	constructor(
		readonly userId: string,
		readonly email: string,
		readonly tenantId: string,
		readonly role: Roles,
	) {
		this.ocurredAt = new Date();
	}
}
