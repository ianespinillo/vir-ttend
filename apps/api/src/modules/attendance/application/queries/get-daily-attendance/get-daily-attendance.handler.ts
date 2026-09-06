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
import { GetDailyAttendanceQuery } from './get-daily-attendance.query';

@Injectable()
export class GetDailyAttendanceQueryHandler {
	constructor(
		@Inject('IAttendanceRecordRepository')
		private readonly attendanceRepo: IAttendanceRecordRepository,
		@Inject('IStudentPort')
		private readonly studentPort: IStudentPort,
		@Inject('IJustificationRepository')
		private readonly justificationRepo: IJustificationRepository,
	) {}

	async execute(
		query: GetDailyAttendanceQuery,
	): Promise<AttendanceRecordResponseDto[]> {
		const records = await this.attendanceRepo.findByCourseAndDate(
			query.courseId,
			query.date,
		);
		const students = await this.studentPort.getByCourseId(query.courseId);
		// should match students with record, if a student doesn't was registered, return null.
		const result: AttendanceRecordResponseDto[] = [];

		for (const student of students) {
			const attendanceRecord = records.find((r) => r.studentId === student.id);

			if (attendanceRecord?.status === ATTENDANCE_STATUS.JUSTIFIED) {
				const justification = await this.justificationRepo.findByRecord(
					attendanceRecord.id,
				);
				if (!justification)
					throw new InternalServerErrorException(
						`AttendanceRecord ${attendanceRecord.id} is marked as JUSTIFIED but has no justification.`,
					);
				result.push(
					new AttendanceRecordResponseDto(student, attendanceRecord, justification),
				);
			} else {
				result.push(
					new AttendanceRecordResponseDto(
						student,
						records.find((r) => r.studentId === student.id),
					),
				);
			}
		}

		return result;
	}
}
