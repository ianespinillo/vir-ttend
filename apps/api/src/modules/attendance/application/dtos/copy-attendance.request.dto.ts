import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CopyAttendanceRequestDto {
	@IsString()
	subjectId!: string;

	@IsDateString()
	targetDate!: string;

	@IsDateString()
	@IsOptional()
	sourceDate?: string;
}
