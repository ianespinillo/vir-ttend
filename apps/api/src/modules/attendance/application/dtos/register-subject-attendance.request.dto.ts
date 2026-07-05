import { ATTENDANCE_STATUS, AttendanceStatus } from '@repo/common';
import { Type } from 'class-transformer';
import {
	IsArray,
	IsDateString,
	IsEnum,
	IsString,
	ValidateNested,
} from 'class-validator';

class SubjectAttendanceRecordDto {
	@IsString()
	studentId!: string;

	@IsEnum(ATTENDANCE_STATUS)
	status!: AttendanceStatus;
}

export class RegisterSubjectAttendanceRequestDto {
	@IsString()
	subjectId!: string;

	@IsString()
	courseId!: string;

	@IsDateString()
	date!: string;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SubjectAttendanceRecordDto)
	records!: SubjectAttendanceRecordDto[];
}
