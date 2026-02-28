import { ROLES, Roles } from '@repo/common';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class ChangeRoleRequestDto {
	@IsEnum(ROLES)
	@IsNotEmpty()
	newRole!: Roles;
}
