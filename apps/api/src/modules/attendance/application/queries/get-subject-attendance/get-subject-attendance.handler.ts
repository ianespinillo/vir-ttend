import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { IStudentPort } from '../../../domain/ports/student.port.interface';
import { ISubjectPort } from '../../../domain/ports/subject.port.interface';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import { AttendanceRecordResponseDto } from '../../dtos/attendance-record.response.dto';
import { SubjectAttendanceResponseDto } from '../../dtos/subject-attendance.response.dto';
import { GetSubjectAttendanceQuery } from './get-subject-attendance.query';

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
		const records = await this.attendanceRepo.findBySubjectAndDate(
			query.subjectId,
			query.date,
		);
		const dto: AttendanceRecordResponseDto[] = [];
		for (const record of records) {
			const student = await this.studentPort.findById(record.studentId);
			dto.push(new AttendanceRecordResponseDto(student, record));
		}
		return new SubjectAttendanceResponseDto({
			subjectId: subject.id,
			subjectName: subject.name,
			courseId: subject.courseId,
			date: query.date.toLocaleDateString(),
			records: dto,
		});
	}
}
