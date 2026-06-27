import { ATTENDANCE_STATUS, AttendanceStatus } from '@repo/common';
// bulk-register-attendance.request.dto.ts
import { IsDateString, IsEnum, IsUUID } from 'class-validator';

export class BulkRegisterAttendanceRequestDto {
	@IsUUID() courseId!: string;
	@IsDateString() date!: string;
	@IsEnum(ATTENDANCE_STATUS) defaultStatus!: AttendanceStatus;
}
