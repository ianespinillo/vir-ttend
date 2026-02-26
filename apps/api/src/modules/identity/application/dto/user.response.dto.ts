import { IUserResponse, Roles } from '@repo/common';

// user.response.dto.ts
export class UserResponseDto implements IUserResponse {
	id!: string;
	email!: string;
	firstName!: string;
	lastName!: string;
	role!: Roles;
	tenantId!: string;
	mustChangePassword!: boolean;
}
