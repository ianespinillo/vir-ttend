import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ATTENDANCE_THRESHOLDS } from '@repo/common';
import { ICoursePort } from '../../../domain/ports/courses.port.interface';
import { IStudentPort } from '../../../domain/ports/student.port.interface';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import { AttendanceRecordResponseDto } from '../../dtos/attendance-record.response.dto';
import { CourseSnapshotDto } from '../../dtos/course-snapshot.dto';
import { CourseSnapshotBuilderService } from '../../services/course-snapshot-builder.service';
import { GetCourseDailyOverviewQuery } from './get-course-daily-overview.query';

@Injectable()
export class GetCourseDailyOverviewQueryHandler {
	constructor(
		@Inject('IAttendanceRecordRepository')
		private readonly attendanceRepo: IAttendanceRecordRepository,
		@Inject('ICoursePort')
		private readonly coursePort: ICoursePort,
		private readonly snapshotService: CourseSnapshotBuilderService,
		@Inject('IStudentPort')
		private readonly studentPort: IStudentPort,
	) {}
	async execute(
		query: GetCourseDailyOverviewQuery,
	): Promise<{ records: AttendanceRecordResponseDto[] } & CourseSnapshotDto> {
		const course = await this.coursePort.findById(query.courseId);
		if (!course)
			throw new NotFoundException(`Course doesn't exist: ${query.courseId}`);
		const records = await this.attendanceRepo.findByCourseAndDate(
			query.courseId,
			query.date,
		);
		const snapshot = await this.snapshotService.buildCourseSnapshot(
			query.courseId,
			query.date,
		);
		const dtos: AttendanceRecordResponseDto[] = [];
		for (const record of records) {
			const student = await this.studentPort.findById(record.studentId);
			if (!student) {
				throw new NotFoundException(`Student doesn't exist: ${record.studentId}`);
			}
			dtos.push(new AttendanceRecordResponseDto(student, record));
		}
		return {
			records: dtos,
			...snapshot.toJSON(),
			statusColor: snapshot.getRiskStatus(
				ATTENDANCE_THRESHOLDS.WARNING,
				ATTENDANCE_THRESHOLDS.CRITICAL,
			),
			lastUpdated: new Date(),
			level: course.level,
		};
	}
}
