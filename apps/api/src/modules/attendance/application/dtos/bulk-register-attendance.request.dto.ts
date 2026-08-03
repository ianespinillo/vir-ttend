import { ApiProperty } from '@nestjs/swagger';
import { ATTENDANCE_STATUS, AttendanceStatus } from '@repo/common';
// bulk-register-attendance.request.dto.ts
import { IsDateString, IsEnum, IsUUID } from 'class-validator';

export class BulkRegisterAttendanceRequestDto {
	@IsUUID()
	@ApiProperty({
		description: 'Identificador del curso al que se registra la asistencia',
		example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
	})
	courseId!: string;

	@IsDateString()
	@ApiProperty({
		description: 'Fecha del registro de asistencia',
		example: '2026-03-10',
	})
	date!: string;

	@IsEnum(ATTENDANCE_STATUS)
	@ApiProperty({
		description:
			'Estado de asistencia aplicado por defecto a todos los estudiantes del curso',
		enum: ATTENDANCE_STATUS,
		example: ATTENDANCE_STATUS.ABSENT,
	})
	defaultStatus!: AttendanceStatus;
}
