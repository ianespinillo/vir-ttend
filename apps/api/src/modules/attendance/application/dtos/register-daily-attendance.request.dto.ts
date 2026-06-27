// register-daily-attendance.request.dto.ts

import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsUUID, ValidateNested } from 'class-validator';
import { RegisterAttendanceRecordDto } from './register-attendance-record.dto';

export class RegisterDailyAttendanceRequestDto {
	@IsUUID() courseId!: string;
	@IsDateString() date!: string;
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => RegisterAttendanceRecordDto)
	records!: RegisterAttendanceRecordDto[];
}
