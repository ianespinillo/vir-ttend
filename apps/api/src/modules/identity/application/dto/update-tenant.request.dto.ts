import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UpdateTenantRequestDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({
		description: 'Nuevo nombre del tenant.',
		example: 'Escuela Técnica N°1 - Turno Mañana',
	})
	name!: string;

	@IsString()
	@IsNotEmpty()
	@IsEmail()
	@ApiProperty({
		description: 'Nuevo email de contacto del tenant.',
		example: 'nuevo@tec1.edu.ar',
	})
	contactEmail!: string;
}
