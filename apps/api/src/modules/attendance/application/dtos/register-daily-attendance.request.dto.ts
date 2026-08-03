import { ApiProperty } from '@nestjs/swagger';
// register-daily-attendance.request.dto.ts

import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsUUID, ValidateNested } from 'class-validator';
import { RegisterAttendanceRecordDto } from './register-attendance-record.dto';

export class RegisterDailyAttendanceRequestDto {
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

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => RegisterAttendanceRecordDto)
	@ApiProperty({
		description: 'Registros de asistencia por estudiante',
		type: [RegisterAttendanceRecordDto],
		example: [
			{ studentId: '1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f', status: 'present' },
			{ studentId: '8f7e6d5c-4b3a-2c1d-0e9f-8a7b6c5d4e3f', status: 'absent' },
		],
	})
	records!: RegisterAttendanceRecordDto[];
}
