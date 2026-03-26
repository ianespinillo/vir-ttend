import { ShiftType } from '@repo/common';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCourseRequestDto {
	@IsString()
	@IsOptional()
	preceptorId?: string;

	@IsString()
	@IsOptional()
	shift?: ShiftType;
}
