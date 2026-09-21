import { ApiProperty } from '@nestjs/swagger';
import { ROLES, Roles } from '@repo/common';
import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';

export class CreateMembershipRequestDto {
	@IsNotEmpty()
	@IsEmail()
	@ApiProperty({
		description: 'Email del usuario a vincular',
		example: 'tec1@abc.gob.ar',
	})
	email!: string;

	@IsNotEmpty()
	@IsEnum(ROLES)
	@ApiProperty({
		description: 'Rol que tendra el usuario',
		example: ROLES.TEACHER,
	})
	role!: Roles;
}
