import { ATTENDANCE_STATUS, AttendanceStatus } from '@repo/common';
import { IsDate, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class BulkUpdateSubjectStatusRequestDto {
	@IsString()
	@IsNotEmpty()
	subjectId!: string;

	@IsEnum(ATTENDANCE_STATUS)
	@IsNotEmpty()
	status!: AttendanceStatus;

	@IsDate()
	@IsNotEmpty()
	date!: Date;
}
