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
import { GetAttendanceByStudentQuery } from './get-attendance-by-student.query';

@Injectable()
export class GetAttendanceByStudentQueryHandler {
	constructor(
		@Inject('IAttendanceRecordRepository')
		private readonly attendanceRepo: IAttendanceRecordRepository,
		@Inject('IJustificationRepository')
		private readonly justificationRepository: IJustificationRepository,
		@Inject('IStudentPort')
		private readonly studentPort: IStudentPort,
	) {}

	async execute(
		query: GetAttendanceByStudentQuery,
	): Promise<AttendanceRecordResponseDto[]> {
		const records = await this.attendanceRepo.findByStudentAndDateRange(
			query.studentId,
			query.from,
			query.to,
		);
		const student = await this.studentPort.findById(query.studentId);
		if (!student) {
			throw new InternalServerErrorException(
				`Student with ID ${query.studentId} not found.`,
			);
		}
		const result: AttendanceRecordResponseDto[] = [];
		for (const record of records) {
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
