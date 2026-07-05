import { BadRequestException, Injectable } from '@nestjs/common';
import { ISubjectPort } from '../../../domain/ports/subject.port.interface';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import { AttendanceRecordResponseDto } from '../../dtos/attendance-record.response.dto';
import { SubjectAttendanceResponseDto } from '../../dtos/subject-attendance.response.dto';
import { GetSubjectAttendanceQuery } from './get-subject-attendance.query';

@Injectable()
export class GetSubjectAttendanceQueryHandler {
	constructor(
		private readonly subjectPort: ISubjectPort,
		private readonly attendanceRepo: IAttendanceRecordRepository,
	) {}
	async execute(
		query: GetSubjectAttendanceQuery,
	): Promise<SubjectAttendanceResponseDto> {
		const subject = await this.subjectPort.getSubjectById(query.subjectId);
		if (!subject) throw new BadRequestException('Invalid subject id');
		const records = await this.attendanceRepo.findBySubjectAndDate(
			query.subjectId,
			query.date,
		);
		return new SubjectAttendanceResponseDto({
			subjectId: subject.id,
			subjectName: subject.name,
			courseId: subject.courseId,
			date: query.date.toLocaleDateString(),
			records: records.map((r) => new AttendanceRecordResponseDto(r.studentId, r)),
		});
	}
}
