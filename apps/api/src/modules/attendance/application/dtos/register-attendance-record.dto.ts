import { ATTENDANCE_STATUS, AttendanceStatus } from '@repo/common';
import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class RegisterAttendanceRecordDto {
	@IsNotEmpty()
	@IsString()
	@IsUUID()
	studentId!: string;

	@IsNotEmpty()
	@IsEnum(ATTENDANCE_STATUS)
	status!: AttendanceStatus;
}
