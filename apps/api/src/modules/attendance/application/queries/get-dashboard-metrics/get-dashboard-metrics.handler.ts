import { Injectable, NotFoundException } from '@nestjs/common';
import { ATTENDANCE_THRESHOLDS, LEVEL } from '@repo/common';
import { AttendanceRecord } from '../../../domain/entities/attendance-record.entity';
import { IAcademicYearPort } from '../../../domain/ports/academic-year.port.interface';
import { ICoursePort } from '../../../domain/ports/courses.port.interface';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import { DashboardService } from '../../../domain/services/dashboard.service';
import { CourseSnapshot } from '../../../domain/value-objects/course-snapshot.vo';
import { CourseSnapshotDto } from '../../dtos/course-snapshot.dto';
import { DashboardMetricsResponseDto } from '../../dtos/dashboard-metrics.response.dto';
import { GetDashboardMetricsQuery } from './get-dashboard-metrics.query';

@Injectable()
export class GetDashboardMetricsQueryHandler {
	constructor(
		private readonly coursePort: ICoursePort,
		private readonly attendanceRepo: IAttendanceRecordRepository,
		private readonly academicYearPort: IAcademicYearPort,
		private readonly dashService: DashboardService,
	) {}
	async execute(
		query: GetDashboardMetricsQuery,
	): Promise<DashboardMetricsResponseDto> {
		const year = await this.academicYearPort.findById(query.academicYearId);
		if (!year) throw new NotFoundException('Cannot find a academic year');
		const preceptorCourses = await this.coursePort.findByPreceptorId(
			query.preceptorId,
		);
		const thisYearCourses = preceptorCourses.filter(
			(course) => course.academicYearId === query.academicYearId,
		);
		const courses = new Map(thisYearCourses.map((c) => [c.id, c]));
		if (thisYearCourses.length === 0) {
			return new DashboardMetricsResponseDto({
				averageAttendance: 0,
				coursesAtRisk: [],
				weeklyTrend: [],
			});
		}
		const snapshots: CourseSnapshot[] = [];
		const records: AttendanceRecord[] = [];
		for (const course of thisYearCourses) {
			const [courseSnapshots, courseRecords] = await Promise.all([
				await this.dashService.buildCourseSnapshot(
					course.id,
					year.startDate,
					year.endDate,
				),
				await this.attendanceRepo.findByCourseAndRange(
					course.id,
					year.startDate,
					year.endDate,
				),
			]);
			snapshots.push(courseSnapshots);
			records.push(...courseRecords);
		}

		return new DashboardMetricsResponseDto({
			averageAttendance:
				snapshots.reduce((acc, next) => acc + next.presentsPercent, 0) /
				snapshots.length,
			weeklyTrend: this.dashService.buildWeeklyTrend(records),
			coursesAtRisk: snapshots.map(
				(s) =>
					new CourseSnapshotDto({
						...s.toJSON(),
						statusColor: s.getRiskStatus(
							ATTENDANCE_THRESHOLDS.WARNING,
							ATTENDANCE_THRESHOLDS.CRITICAL,
						),
						lastUpdated: new Date(),
						level: courses.get(s.courseId)?.level ?? LEVEL.DEFAULT,
					}),
			),
		});
	}
}
