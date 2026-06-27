import { Injectable } from '@nestjs/common';
import { ATTENDANCE_STATUS } from '@repo/common';
import { IStudentPort } from '../../../domain/ports/student.port.interface';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import { AttendanceMetricsResponseDto } from '../../dtos/attendance-metrics.response.dto';
import { GetAttendanceMetricsQuery } from './get-attendance-metrics.query';
@Injectable()
export class GetAttendanceMetricsQueryHandler {
	constructor(
		private readonly attendanceRepo: IAttendanceRecordRepository,
		private readonly studentFinder: IStudentPort,
	) {}
	async execute(
		query: GetAttendanceMetricsQuery,
	): Promise<AttendanceMetricsResponseDto> {
		const students = await this.studentFinder.getByCourseId(query.courseId);
		const records = await this.attendanceRepo.findByCourseAndDate(
			query.courseId,
			query.date,
		);
		const studentsWithAttendance = new Set(records.map((r) => r.studentId));

		const absent = records.filter(
			(r) => r.status === ATTENDANCE_STATUS.ABSENT,
		).length;
		const totalStudents = students.length;
		const absencePercent =
			totalStudents > 0 ? Math.round((absent / totalStudents) * 100) : 0;

		return new AttendanceMetricsResponseDto({
			totalStudents,
			present: records.filter((r) => r.status === ATTENDANCE_STATUS.PRESENT)
				.length,
			absent,
			late: records.filter((r) => r.status === ATTENDANCE_STATUS.LATE).length,
			justified: records.filter((r) => r.status === ATTENDANCE_STATUS.JUSTIFIED)
				.length,
			notRecorded: students.filter((s) => !studentsWithAttendance.has(s.id))
				.length,
			absencePercent,
		});
	}
}
