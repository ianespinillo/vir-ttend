import { IsDateString, IsEmail, IsOptional, IsString } from 'class-validator';

// update-student.request.dto.ts
export class UpdateStudentRequestDto {
	@IsString() @IsOptional() firstName?: string;
	@IsString() @IsOptional() lastName?: string;
	@IsDateString() @IsOptional() birthDate?: string;
	@IsString() @IsOptional() tutorName?: string;
	@IsString() @IsOptional() tutorPhone?: string;
	@IsEmail() @IsOptional() tutorEmail?: string;
}
