import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UpdateTenantRequestDto {
	@IsString()
	@IsNotEmpty()
	name!: string;

	@IsString()
	@IsNotEmpty()
	@IsEmail()
	contactEmail!: string;
}
