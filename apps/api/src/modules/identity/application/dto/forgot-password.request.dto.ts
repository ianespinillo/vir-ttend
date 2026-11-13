import { ApiProperty } from '@nestjs/swagger';
import {
	IsEmail,
	IsNotEmpty,
	IsString,
	Matches,
	MaxLength,
	MinLength,
} from 'class-validator';
import { Match } from './change-password.request.dto';

export class ForgotPasswordRequestDto {
	@IsEmail({}, { message: 'El correo electrónico no es válido.' })
	@ApiProperty({
		description: 'Email de la cuenta a recuperar.',
		example: 'm.gonzalez@escuela.edu.ar',
	})
	email!: string;
}

export class ResetPasswordRequestDto {
	@IsEmail({}, { message: 'El correo electrónico no es válido.' })
	@ApiProperty({
		description: 'Email de la cuenta a recuperar.',
		example: 'm.gonzalez@escuela.edu.ar',
	})
	email!: string;

	@IsString()
	@Matches(/^\d{6}$/, { message: 'El código debe tener 6 dígitos.' })
	@ApiProperty({
		description: 'Código de 6 dígitos recibido por correo.',
		example: '042917',
	})
	code!: string;

	@IsNotEmpty()
	@IsString()
	@MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
	@MaxLength(20, {
		message: 'La contraseña debe tener como máximo 20 caracteres.',
	})
	@ApiProperty({ description: 'Nueva contraseña.', example: 'NuevaClave1!' })
	newPassword!: string;

	@IsNotEmpty()
	@IsString()
	@Match('newPassword', { message: 'Las contraseñas no coinciden.' })
	@ApiProperty({
		description: 'Repetición de la nueva contraseña.',
		example: 'NuevaClave1!',
	})
	confirmNewPassword!: string;
}
