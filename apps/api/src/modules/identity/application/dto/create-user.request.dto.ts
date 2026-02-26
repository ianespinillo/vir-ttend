import { ROLES, Roles } from '@repo/common';
import { IsEmail, IsEnum, IsString, IsUUID } from 'class-validator';

// create-user.request.dto.ts
export class CreateUserRequestDto {
	@IsEmail()
	email!: string;

	@IsString()
	firstName!: string;

	@IsString()
	lastName!: string;

	@IsEnum(ROLES)
	role!: Roles;

	@IsUUID()
	tenantId!: string;
}
