import {
	Inject,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { ATTENDANCE_STATUS } from '@repo/common';
import { IStudentPort } from '../../../domain/ports/student.port.interface';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import { IJustificationRepository } from '../../../domain/repositories/justification.repository.interface';
import { AttendanceRecordResponseDto } from '../../dtos/attendance-record.response.dto';
import { GetAttendanceHistoryQuery } from './get-attendance-history.query';

@Injectable()
export class GetAttendanceHistoryQueryHandler {
	constructor(
		@Inject('IAttendanceRecordRepository')
		private readonly attendanceRepo: IAttendanceRecordRepository,
		@Inject('IJustificationRepository')
		private readonly justificationRepository: IJustificationRepository,
		@Inject('IStudentPort')
		private readonly studentPort: IStudentPort,
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
			const student = await this.studentPort.findById(record.studentId);
			if (!student)
				throw new InternalServerErrorException(
					`Student ${record.studentId} not found.`,
				);
			if (record.status === ATTENDANCE_STATUS.JUSTIFIED) {
				const j = await this.justificationRepository.findByRecord(record.id);
				if (!j)
					throw new InternalServerErrorException(
						`AttendanceRecord ${record.id} is marked as JUSTIFIED but has no justification.`,
					);
				result.push(new AttendanceRecordResponseDto(student, record, j));
			}
			result.push(new AttendanceRecordResponseDto(student, record));
		}
		return result;
	}
}
