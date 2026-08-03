import { ApiProperty } from '@nestjs/swagger';
import { ATTENDANCE_STATUS, AttendanceStatus } from '@repo/common';
import { IsDate, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class BulkUpdateSubjectStatusRequestDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({
		description: 'Identificador de la materia',
		example: '7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f',
	})
	subjectId!: string;

	@IsEnum(ATTENDANCE_STATUS)
	@IsNotEmpty()
	@ApiProperty({
		description: 'Estado de asistencia aplicado a todos los estudiantes',
		enum: ATTENDANCE_STATUS,
		example: ATTENDANCE_STATUS.ABSENT,
	})
	status!: AttendanceStatus;

	@IsDate()
	@IsNotEmpty()
	@ApiProperty({
		description: 'Fecha del registro de asistencia',
		example: '2026-03-10T13:00:00.000Z',
		type: Date,
		format: 'date-time',
	})
	date!: Date;
}
