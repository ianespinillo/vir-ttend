import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateTenantRequestDto {
	@IsString()
	@IsNotEmpty()
	name!: string;

	@IsString()
	@IsNotEmpty()
	subdomain!: string;

	@IsString()
	@IsEmail()
	@IsNotEmpty()
	contactEmail!: string;
}
