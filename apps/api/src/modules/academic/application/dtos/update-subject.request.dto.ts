import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateSubjectRequestDto {
	@IsString()
	@IsOptional()
	teacherId?: string;

	@IsString()
	@IsOptional()
	name?: string;

	@IsString()
	@IsOptional()
	area?: string;

	@IsOptional()
	@IsNumber()
	weeklyHours?: number;
}
