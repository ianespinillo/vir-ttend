import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import { GetDailyAttendanceQuery } from './get-daily-attendance.query';

import { AttendanceRecord } from '../../../domain/entities/attendance-record.entity';
import { IStudentPort } from '../../../domain/ports/student.port.interface';
import { IJustificationRepository } from '../../../domain/repositories/justification.repository.interface';
import { AttendanceRecordResponseDto } from '../../dtos/attendance-record.response.dto';

@Injectable()
export class GetDailyAttendanceQueryHandler {
	constructor(
		private readonly attendanceRepo: IAttendanceRecordRepository,
		private readonly studentPort: IStudentPort,
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

			if (attendanceRecord) {
				const justification = await this.justificationRepo.findByRecord(
					attendanceRecord.id,
				);
				if (!justification)
					throw new InternalServerErrorException(
						`AttendanceRecord ${attendanceRecord.id} is marked as JUSTIFIED but has no justification.`,
					);
				result.push(
					new AttendanceRecordResponseDto(
						student.id,
						attendanceRecord,
						justification,
					),
				);
			} else {
				result.push(new AttendanceRecordResponseDto(student.id));
			}
		}

		return result;
	}
}
