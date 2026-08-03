import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

// login.request.dto.ts
export class LoginRequestDto {
	@IsEmail()
	@ApiProperty({
		description: 'Email del usuario.',
		example: 'm.gonzalez@escuela.edu.ar',
	})
	email!: string;

	@IsString()
	@MinLength(8)
	@ApiProperty({
		description: 'Contraseña del usuario (mínimo 8 caracteres).',
		example: 'contraseñaSegura123',
	})
	password!: string;
}
