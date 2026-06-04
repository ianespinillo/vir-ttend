import {
	IsDateString,
	IsEmail,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
} from 'class-validator';

// create-student.request.dto.ts
export class CreateStudentRequestDto {
	@IsString() @IsNotEmpty() firstName!: string;
	@IsString() @IsNotEmpty() lastName!: string;
	@IsString() @IsNotEmpty() documentNumber!: string;
	@IsDateString() birthDate!: string;
	@IsUUID() courseId!: string;
	@IsString() @IsNotEmpty() tutorName!: string;
	@IsString() @IsNotEmpty() tutorPhone!: string;
	@IsEmail() @IsOptional() tutorEmail?: string;
}
