import { AttendanceStatus } from '@repo/common';
import { AttendanceRecord } from '../../domain/entities/attendance-record.entity';
import { Justification } from '../../domain/entities/justification.entity';
import { JustificationResponseDto } from './justification.response.dto';

export class AttendanceRecordResponseDto {
	readonly id?: string;
	readonly studentId: string;
	readonly status?: AttendanceStatus;
	readonly date?: Date;
	readonly editedBy?: string;
	readonly editedAt?: Date;
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
