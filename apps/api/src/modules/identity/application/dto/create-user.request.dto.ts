import { ApiProperty } from '@nestjs/swagger';
import { ROLES, Roles } from '@repo/common';
import { IsEmail, IsEnum, IsString, IsUUID } from 'class-validator';

// create-user.request.dto.ts
export class CreateUserRequestDto {
	@IsEmail()
	@ApiProperty({
		description: 'Email del usuario (único en el sistema).',
		example: 'prof.jperez@escuela.edu.ar',
	})
	email!: string;

	@IsString()
	@ApiProperty({
		description: 'Primer nombre del usuario.',
		example: 'Juan',
	})
	firstName!: string;

	@IsString()
	@ApiProperty({
		description: 'Apellido del usuario.',
		example: 'Pérez',
	})
	lastName!: string;

	@IsEnum(ROLES)
	@ApiProperty({
		description: 'Rol que se asignará al usuario dentro del tenant.',
		enum: ROLES,
		example: ROLES.TEACHER,
	})
	role!: Roles;

	@IsUUID()
	@ApiProperty({
		description: 'Identificador del tenant al que se vincula el usuario.',
		example: '2d4e0f5a-8c1b-4d3e-9a2f-6b8c0d1e2f3a',
	})
	tenantId!: string;
}
