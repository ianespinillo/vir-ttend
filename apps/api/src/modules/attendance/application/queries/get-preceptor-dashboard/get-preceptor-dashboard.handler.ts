import { Injectable } from '@nestjs/common';
import { ATTENDANCE_THRESHOLDS } from '@repo/common';
import { ICoursePort } from '../../../domain/ports/courses.port.interface';
import { DashboardService } from '../../../domain/services/dashboard.service';
import { CourseSnapshotDto } from '../../dtos/course-snapshot.dto';
import { PreceptorDashboardResponseDto } from '../../dtos/preceptor-dashboard.response.dto';
import { GetPreceptorDashboardQuery } from './get-preceptor-dashboard.query';

@Injectable()
export class GetPreceptorDashboardQueryHandler {
	constructor(
		private readonly coursePort: ICoursePort,
		private readonly dashService: DashboardService,
	) {}
	async execute(
		query: GetPreceptorDashboardQuery,
	): Promise<PreceptorDashboardResponseDto> {
		const courses = await this.coursePort.findByPreceptorId(query.preceptorId);
		const snapshots: CourseSnapshotDto[] = [];
		for (const course of courses) {
			const snapshot = await this.dashService.buildCourseSnapshot(
				course.id,
				query.date,
			);
			snapshots.push({
				...snapshot.toJSON(),
				statusColor: snapshot.getRiskStatus(
					ATTENDANCE_THRESHOLDS.WARNING,
					ATTENDANCE_THRESHOLDS.CRITICAL,
				),
				lastUpdated: new Date(),
				level: course.level,
			});
		}
		return new PreceptorDashboardResponseDto(query.date, snapshots);
	}
}
