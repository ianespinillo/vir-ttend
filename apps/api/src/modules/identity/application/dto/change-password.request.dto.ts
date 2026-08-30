import {
	Equals,
	IsNotEmpty,
	IsString,
	MaxLength,
	MinLength,
} from 'class-validator';

export class ChangePasswordRequestDto {
	@IsNotEmpty()
	@IsString()
	@MinLength(8, { message: 'Password must be at least 8 characters long' })
	@MaxLength(20, { message: 'Password must not exceed 20 characters' })
	newPassword!: string;
	@IsNotEmpty()
	@IsString()
	@MaxLength(20, { message: 'Password must not exceed 20 characters' })
	oldPassword!: string;
	@IsNotEmpty()
	@IsString()
	@MinLength(8, { message: 'Password must be at least 8 characters long' })
	@MaxLength(20, { message: 'Password must not exceed 20 characters' })
	@Equals('newPassword', { message: 'Passwords do not match' })
	confirmNewPassword!: string;
}
