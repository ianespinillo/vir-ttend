import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ATTENDANCE_STATUS } from '@repo/common';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import { IJustificationRepository } from '../../../domain/repositories/justification.repository.interface';
import { AttendanceRecordResponseDto } from '../../dtos/attendance-record.response.dto';
import { GetAttendanceHistoryQuery } from './get-attendance-history.query';

@Injectable()
export class GetAttendanceHistoryQueryHandler {
	constructor(
		private readonly attendanceRepo: IAttendanceRecordRepository,
		private readonly justificationRepository: IJustificationRepository,
	) {}

	async execute(
		query: GetAttendanceHistoryQuery,
	): Promise<AttendanceRecordResponseDto[]> {
		const records = await this.attendanceRepo.findByCourseAndRange(
			query.courseId,
			query.from,
			query.to,
		);
		const result: AttendanceRecordResponseDto[] = [];
		for (const record of records) {
			if (record.status === ATTENDANCE_STATUS.JUSTIFIED) {
				const j = await this.justificationRepository.findByRecord(record.id);
				if (!j)
					throw new InternalServerErrorException(
						`AttendanceRecord ${record.id} is marked as JUSTIFIED but has no justification.`,
					);
				result.push(new AttendanceRecordResponseDto(record.studentId, record, j));
			}
			result.push(new AttendanceRecordResponseDto(record.studentId, record));
		}
		return result;
	}
}
