import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateSubjectRequestDto {
	@IsNotEmpty()
	@IsString()
	courseId!: string;

	@IsNotEmpty()
	@IsString()
	teacherId!: string;

	@IsNotEmpty()
	@IsString()
	name!: string;

	@IsNotEmpty()
	@IsString()
	area!: string;

	@IsNotEmpty()
	@IsNumber()
	@Min(1)
	weeklyHours!: number;
}
