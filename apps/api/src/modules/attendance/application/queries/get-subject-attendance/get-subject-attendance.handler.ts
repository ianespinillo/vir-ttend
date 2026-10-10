import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { IStudentPort } from '../../../domain/ports/student.port.interface';
import { ISubjectPort } from '../../../domain/ports/subject.port.interface';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import { AttendanceRecordResponseDto } from '../../dtos/attendance-record.response.dto';
import { SubjectAttendanceResponseDto } from '../../dtos/subject-attendance.response.dto';
import { assertCanReadSubjectAttendance } from '../../services/subject-access.policy';
import { GetSubjectAttendanceQuery } from './get-subject-attendance.query';

/**
 * Attendance of a subject on a date, as a full roster: every active student of
 * the subject's course appears, with the stored status or none if not recorded
 * yet (same convention as the daily attendance query).
 */
@Injectable()
export class GetSubjectAttendanceQueryHandler {
	constructor(
		@Inject('ISubjectPort')
		private readonly subjectPort: ISubjectPort,
		@Inject('IAttendanceRecordRepository')
		private readonly attendanceRepo: IAttendanceRecordRepository,
		@Inject('IStudentPort')
		private readonly studentPort: IStudentPort,
	) {}
	async execute(
		query: GetSubjectAttendanceQuery,
	): Promise<SubjectAttendanceResponseDto> {
		const subject = await this.subjectPort.getSubjectById(query.subjectId);
		if (!subject) throw new BadRequestException('Invalid subject id');
		assertCanReadSubjectAttendance(subject, {
			userId: query.userId,
			role: query.userRole,
		});
		if (Number.isNaN(query.date.getTime()))
			throw new BadRequestException('Invalid date');

		const [records, students] = await Promise.all([
			this.attendanceRepo.findBySubjectAndDate(query.subjectId, query.date),
			this.studentPort.getActiveByCourseId(subject.courseId),
		]);
		const recordByStudent = new Map(records.map((r) => [r.studentId, r]));
		const roster = [...students]
			.sort((a, b) => a.name.localeCompare(b.name))
			.map(
				(student) =>
					new AttendanceRecordResponseDto(student, recordByStudent.get(student.id)),
			);
		return new SubjectAttendanceResponseDto({
			subjectId: subject.id,
			subjectName: subject.name,
			courseId: subject.courseId,
			date: query.date.toISOString().slice(0, 10),
			records: roster,
		});
	}
}
