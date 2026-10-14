import { ApiProperty } from '@nestjs/swagger';
import { ATTENDANCE_STATUS, AttendanceStatus } from '@repo/common';
import { Type } from 'class-transformer';
import {
	IsArray,
	IsDateString,
	IsEnum,
	IsUUID,
	ValidateNested,
} from 'class-validator';
import { RegisterAttendanceRecordDto } from './register-attendance-record.dto';

export class RegisterWorkshopAttendanceRequestDto {
	@IsUUID()
	@ApiProperty({
		description: 'Identificador de la comisión de taller',
		example: '4d7a2b1c-3e5f-4a6b-8c9d-0e1f2a3b4c5d',
	})
	commissionId!: string;

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
		description:
			'Registros de asistencia por estudiante (deben pertenecer a la comisión)',
		type: [RegisterAttendanceRecordDto],
		example: [
			{ studentId: '1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f', status: 'present' },
		],
	})
	records!: RegisterAttendanceRecordDto[];
}

export class BulkRegisterWorkshopAttendanceRequestDto {
	@IsUUID()
	@ApiProperty({
		description: 'Identificador de la comisión de taller',
		example: '4d7a2b1c-3e5f-4a6b-8c9d-0e1f2a3b4c5d',
	})
	commissionId!: string;

	@IsDateString()
	@ApiProperty({
		description: 'Fecha del registro de asistencia',
		example: '2026-03-10',
	})
	date!: string;

	@IsEnum(ATTENDANCE_STATUS)
	@ApiProperty({
		description: 'Estado que se asigna a todos los estudiantes activos',
		enum: ATTENDANCE_STATUS,
		example: ATTENDANCE_STATUS.PRESENT,
	})
	status!: AttendanceStatus;
}

export class GetWorkshopAttendanceRequestDto {
	@IsUUID()
	@ApiProperty({
		description: 'Identificador de la comisión de taller',
		example: '4d7a2b1c-3e5f-4a6b-8c9d-0e1f2a3b4c5d',
	})
	commissionId!: string;

	@IsDateString()
	@ApiProperty({
		description: 'Fecha de la asistencia (YYYY-MM-DD)',
		example: '2026-03-10',
	})
	date!: string;
}

export class GetMyWorkshopCommissionsRequestDto {
	@IsDateString()
	@ApiProperty({
		description: 'Fecha a consultar (YYYY-MM-DD)',
		example: '2026-03-10',
	})
	date!: string;
}
