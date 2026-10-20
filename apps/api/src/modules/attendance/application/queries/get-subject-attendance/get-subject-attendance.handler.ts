import { Inject, Injectable } from '@nestjs/common';
import { DomainError, NotFoundError } from '../../../../../common/errors';
import { ISubjectPort } from '../../../domain/ports/subject.port.interface';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import { AttendanceRecordResponseDto } from '../../dtos/attendance-record.response.dto';
import { SubjectAttendanceResponseDto } from '../../dtos/subject-attendance.response.dto';
import { assertCanReadSubjectAttendance } from '../../services/subject-access.policy';
import { SubjectRosterService } from '../../services/subject-roster.service';
import { GetSubjectAttendanceQuery } from './get-subject-attendance.query';

/**
 * Attendance of a subject on a date, as a full roster: every active student who
 * attends the subject that day (the whole course, or the targeted workshop
 * commissions) appears, with the stored status or none if not recorded yet
 * (same convention as the daily attendance query).
 */
@Injectable()
export class GetSubjectAttendanceQueryHandler {
	constructor(
		@Inject('ISubjectPort')
		private readonly subjectPort: ISubjectPort,
		@Inject('IAttendanceRecordRepository')
		private readonly attendanceRepo: IAttendanceRecordRepository,
		private readonly subjectRoster: SubjectRosterService,
	) {}
	async execute(
		query: GetSubjectAttendanceQuery,
	): Promise<SubjectAttendanceResponseDto> {
		const subject = await this.subjectPort.getSubjectById(query.subjectId);
		if (!subject) throw new NotFoundError('Materia no encontrada');
		assertCanReadSubjectAttendance(subject, {
			userId: query.userId,
			role: query.userRole,
			tenantId: query.tenantId,
		});
		if (Number.isNaN(query.date.getTime()))
			throw new DomainError('La fecha no es válida');

		const [records, students] = await Promise.all([
			this.attendanceRepo.findBySubjectAndDate(query.subjectId, query.date),
			this.subjectRoster.getActiveRoster(subject, query.date),
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
