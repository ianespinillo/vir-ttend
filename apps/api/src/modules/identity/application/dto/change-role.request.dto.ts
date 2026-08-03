import { ApiProperty } from '@nestjs/swagger';
import { ROLES, Roles } from '@repo/common';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class ChangeRoleRequestDto {
	@IsEnum(ROLES)
	@IsNotEmpty()
	@ApiProperty({
		description: 'Nuevo rol que se asignará al usuario dentro del tenant.',
		enum: ROLES,
		example: ROLES.PRECEPTOR,
	})
	newRole!: Roles;
}
