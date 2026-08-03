import { ApiProperty } from '@nestjs/swagger';
import { ATTENDANCE_STATUS, AttendanceStatus } from '@repo/common';
import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class RegisterAttendanceRecordDto {
	@IsNotEmpty()
	@IsString()
	@IsUUID()
	@ApiProperty({
		description: 'Identificador del estudiante',
		example: '1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f',
	})
	studentId!: string;

	@IsNotEmpty()
	@IsEnum(ATTENDANCE_STATUS)
	@ApiProperty({
		description: 'Estado de asistencia del estudiante',
		enum: ATTENDANCE_STATUS,
		example: ATTENDANCE_STATUS.PRESENT,
	})
	status!: AttendanceStatus;
}
