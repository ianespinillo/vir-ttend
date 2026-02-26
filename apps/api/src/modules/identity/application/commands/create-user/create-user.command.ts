import { Roles } from '@repo/common';

export class CreateUserCommand {
	constructor(
		readonly email: string,
		readonly firstName: string,
		readonly lastName: string,
		readonly role: Roles,
		readonly createdByRole: Roles,
		readonly tenantId: string,
	) {}
}
