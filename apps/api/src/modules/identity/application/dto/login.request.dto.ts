import { IsEmail, IsString, MinLength } from 'class-validator';

// login.request.dto.ts
export class LoginRequestDto {
	@IsEmail()
	email!: string;

	@IsString()
	@MinLength(8)
	password!: string;
}
