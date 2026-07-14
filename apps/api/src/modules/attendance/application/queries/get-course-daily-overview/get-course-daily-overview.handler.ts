import { Injectable, NotFoundException } from '@nestjs/common';
import { ATTENDANCE_THRESHOLDS } from '@repo/common';
import { ICoursePort } from '../../../domain/ports/courses.port.interface';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import { AttendanceRecordResponseDto } from '../../dtos/attendance-record.response.dto';
import { CourseSnapshotDto } from '../../dtos/course-snapshot.dto';
import { CourseSnapshotBuilderService } from '../../services/course-snapshot-builder.service';
import { GetCourseDailyOverviewQuery } from './get-course-daily-overview.query';

@Injectable()
export class GetCourseDailyOverviewQueryHandler {
	constructor(
		private readonly attendanceRepo: IAttendanceRecordRepository,
		private readonly coursePort: ICoursePort,
		private readonly snapshotService: CourseSnapshotBuilderService,
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
		return {
			records,
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
