import { ApiProperty } from '@nestjs/swagger';
import { IUserResponse, ROLES, Roles } from '@repo/common';

// user.response.dto.ts
export class UserResponseDto implements IUserResponse {
	@ApiProperty({
		description: 'Identificador único del usuario (UUID v4).',
		example: '6f2a8c1e-4b7d-4f5a-9d3b-2c1e4f6a8b0d',
	})
	id!: string;

	@ApiProperty({
		description: 'Email del usuario.',
		example: 'm.gonzalez@escuela.edu.ar',
	})
	email!: string;

	@ApiProperty({
		description: 'Primer nombre del usuario.',
		example: 'María',
	})
	firstName!: string;

	@ApiProperty({
		description: 'Apellido del usuario.',
		example: 'González',
	})
	lastName!: string;

	@ApiProperty({
		description: 'Rol del usuario dentro del tenant.',
		enum: ROLES,
		example: ROLES.ADMIN,
	})
	role!: Roles;

	@ApiProperty({
		description: 'Identificador del tenant activo (UUID v4).',
		example: '2d4e0f5a-8c1b-4d3e-9a2f-6b8c0d1e2f3a',
	})
	tenantId!: string;

	@ApiProperty({
		description:
			'Indica si el usuario debe cambiar su contraseña en el próximo inicio de sesión.',
		example: false,
	})
	mustChangePassword!: boolean;
}
