import {
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common';
import { ATTENDANCE_STATUS } from '@repo/common';
import { AttendanceRecord } from '../../../domain/entities/attendance-record.entity';
import { IStudentPort } from '../../../domain/ports/student.port.interface';
import { ISubjectPort } from '../../../domain/ports/subject.port.interface';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import {
	ClassSessionDto,
	StudentSubjectRecordDto,
	SubjectHistoryResponseDto,
} from '../../dtos/subject-history.response.dto';
import { GetSubjectHistoryQuery } from './get-subject-history.query';

@Injectable()
export class GetSubjectHistoryQueryHandler {
	constructor(
		private readonly attendanceRepo: IAttendanceRecordRepository,
		private readonly subjectPort: ISubjectPort,
		private readonly studentPort: IStudentPort,
	) {}
	async execute(
		query: GetSubjectHistoryQuery,
	): Promise<SubjectHistoryResponseDto> {
		const subject = await this.subjectPort.getSubjectById(query.subjectId);
		if (!subject)
			throw new NotFoundException('Subject not found', {
				description: `Subject with id: ${query.subjectId} not founded in database`,
			});
		const records = await this.attendanceRepo.findBySubjectAndDateRange(
			query.subjectId,
			query.from,
			query.to,
		);
		const classes = new Map<string, AttendanceRecord[]>();
		records.forEach((record) => {
			const exists = classes.get(record.date.toLocaleDateString());
			if (exists) exists.push(record);
			else classes.set(record.date.toLocaleDateString(), [record]);
		});
		const classSessionInfo: ClassSessionDto[] = [];
		const studentRecordInfo = [];
		for (const [k, v] of classes.entries()) {
			classSessionInfo.push(
				new ClassSessionDto(
					new Date(k).toLocaleDateString(),
					v.filter((r) => r.status === ATTENDANCE_STATUS.PRESENT).length,
					v.filter((r) => r.status === ATTENDANCE_STATUS.ABSENT).length,
					v.filter((r) => r.status === ATTENDANCE_STATUS.LATE).length,
					v.filter((r) => r.status === ATTENDANCE_STATUS.JUSTIFIED).length,
					v.length,
				),
			);
		}
		const studentRecords = new Map<string, AttendanceRecord[]>();
		records.forEach((record) => {
			const exist = studentRecords.get(record.studentId);
			if (exist) exist.push(record);
			else studentRecords.set(record.studentId, [record]);
		});
		for (const [k, v] of studentRecords.entries()) {
			const s = await this.studentPort.findById(k);
			if (!s)
				throw new InternalServerErrorException('No such student record found');
			studentRecordInfo.push(
				new StudentSubjectRecordDto(
					s.id,
					s.name,
					v.map((r) => ({
						date: r.date.toLocaleDateString(),
						status: r.status,
					})) ?? [],
					(v.filter((r) => r.status === ATTENDANCE_STATUS.ABSENT).length /
						classSessionInfo.length) *
						100,
				),
			);
		}
		return new SubjectHistoryResponseDto({
			subjectId: query.subjectId,
			from: query.from.toLocaleDateString(),
			to: query.to.toLocaleDateString(),
			classDates: Array.from(Object.keys(classes)),
			subjectName: subject.name,
			sessions: classSessionInfo,
			studentRecords: studentRecordInfo,
		});
	}
}
