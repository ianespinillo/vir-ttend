import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateTenantRequestDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({
		description: 'Nombre del tenant (escuela).',
		example: 'Escuela Técnica N°1',
	})
	name!: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({
		description: 'Subdominio único que identifica al tenant en la plataforma.',
		example: 'tec1',
	})
	subdomain!: string;

	@IsString()
	@IsEmail()
	@IsNotEmpty()
	@ApiProperty({
		description: 'Email de contacto del tenant.',
		example: 'admin@tec1.edu.ar',
	})
	contactEmail!: string;
}
