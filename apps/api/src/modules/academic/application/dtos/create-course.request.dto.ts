import { LEVEL, LevelType, SHIFT, ShiftType } from '@repo/common';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateCourseRequestDto {
	@IsNotEmpty()
	@IsString()
	academicYearId!: string;

	@IsNotEmpty()
	@IsString()
	schoolId!: string;

	@IsNotEmpty()
	@IsEnum(LEVEL)
	level!: LevelType;

	@IsNotEmpty()
	@IsEnum(SHIFT)
	shift!: ShiftType;

	@IsNotEmpty()
	@IsNumber()
	yearNumber!: number;

	@IsNotEmpty()
	@IsString()
	division!: string;

	@IsNotEmpty()
	@IsString()
	preceptorId!: string;
}
