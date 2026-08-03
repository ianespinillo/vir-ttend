import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user.response.dto';

// auth.response.dto.ts
export class AuthResponseDto {
	@ApiProperty({
		description: 'Usuario autenticado dentro del tenant seleccionado.',
		type: UserResponseDto,
		example: {
			id: '6f2a8c1e-4b7d-4f5a-9d3b-2c1e4f6a8b0d',
			email: 'm.gonzalez@escuela.edu.ar',
			firstName: 'María',
			lastName: 'González',
			role: 'admin',
			tenantId: '2d4e0f5a-8c1b-4d3e-9a2f-6b8c0d1e2f3a',
			mustChangePassword: false,
		},
	})
	user!: UserResponseDto;

	constructor(user: UserResponseDto) {
		this.user = user;
	}
}
