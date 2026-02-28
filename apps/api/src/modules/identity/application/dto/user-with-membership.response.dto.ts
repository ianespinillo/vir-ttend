import { Roles } from '@repo/common';

export class UserWithMembershipResponseDto {
	constructor(
		readonly id: string,
		readonly email: string,
		readonly firstName: string,
		readonly lastName: string,
		readonly role: Roles,
		readonly isActive: boolean,
		readonly mustChangePassword: boolean,
	) {}
}
