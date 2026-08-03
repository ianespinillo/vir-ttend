import { ApiProperty } from '@nestjs/swagger';
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
	@ApiProperty({
		description: 'Identificador del estudiante',
		example: '1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f',
	})
	studentId!: string;

	@IsEnum(ATTENDANCE_STATUS)
	@ApiProperty({
		description: 'Estado de asistencia del estudiante',
		enum: ATTENDANCE_STATUS,
		example: ATTENDANCE_STATUS.LATE,
	})
	status!: AttendanceStatus;
}

export class RegisterSubjectAttendanceRequestDto {
	@IsString()
	@ApiProperty({
		description: 'Identificador de la materia',
		example: '7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f',
	})
	subjectId!: string;

	@IsString()
	@ApiProperty({
		description: 'Identificador del curso al que pertenece la materia',
		example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
	})
	courseId!: string;

	@IsDateString()
	@ApiProperty({
		description: 'Fecha de la clase',
		example: '2026-03-10',
	})
	date!: string;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SubjectAttendanceRecordDto)
	@ApiProperty({
		description: 'Registros de asistencia por estudiante de la materia',
		type: [SubjectAttendanceRecordDto],
		example: [
			{ studentId: '1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f', status: 'late' },
			{ studentId: '8f7e6d5c-4b3a-2c1d-0e9f-8a7b6c5d4e3f', status: 'present' },
		],
	})
	records!: SubjectAttendanceRecordDto[];
}
