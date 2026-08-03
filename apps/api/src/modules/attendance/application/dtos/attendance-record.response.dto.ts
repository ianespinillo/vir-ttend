import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ATTENDANCE_STATUS, AttendanceStatus } from '@repo/common';
import { AttendanceRecord } from '../../domain/entities/attendance-record.entity';
import { Justification } from '../../domain/entities/justification.entity';
import { JustificationResponseDto } from './justification.response.dto';

export class AttendanceRecordResponseDto {
	@ApiPropertyOptional({
		description: 'Identificador del registro de asistencia',
		example: '5c4d3e2f-1a2b-3c4d-5e6f-7a8b9c0d1e2f',
	})
	readonly id?: string;

	@ApiProperty({
		description: 'Identificador del estudiante',
		example: '1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f',
	})
	readonly studentId: string;

	@ApiPropertyOptional({
		description: 'Estado de asistencia del estudiante',
		enum: ATTENDANCE_STATUS,
		example: ATTENDANCE_STATUS.PRESENT,
	})
	readonly status?: AttendanceStatus;

	@ApiPropertyOptional({
		description: 'Fecha del registro de asistencia',
		example: '2026-03-10T13:00:00.000Z',
		type: Date,
		format: 'date-time',
	})
	readonly date?: Date;

	@ApiPropertyOptional({
		description:
			'Identificador del usuario que realizó la última edición del registro',
		example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
	})
	readonly editedBy?: string;

	@ApiPropertyOptional({
		description: 'Fecha y hora de la última edición del registro',
		example: '2026-03-10T14:30:00.000Z',
		type: Date,
		format: 'date-time',
	})
	readonly editedAt?: Date;

	@ApiPropertyOptional({
		description: 'Justificación asociada al registro, si el estado es justified',
		type: JustificationResponseDto,
	})
	readonly justification?: JustificationResponseDto;

	constructor(
		studentId: string,
		record?: AttendanceRecord,
		justification?: Justification,
	) {
		this.id = record?.id ?? undefined;
		this.studentId = studentId;
		this.status = record?.status ?? undefined;
		this.date = record?.date ?? undefined;
		this.editedBy = record?.editedBy ?? undefined;
		this.editedAt = record?.editedAt ?? undefined;
		this.justification = justification
			? new JustificationResponseDto(justification)
			: undefined;
	}
}
