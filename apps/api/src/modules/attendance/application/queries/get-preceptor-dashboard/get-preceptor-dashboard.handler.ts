import { Inject, Injectable } from '@nestjs/common';
import { ATTENDANCE_THRESHOLDS } from '@repo/common';
import { IAcademicYearPort } from '../../../domain/ports/academic-year.port.interface';
import { ICoursePort } from '../../../domain/ports/courses.port.interface';
import { CourseSnapshotDto } from '../../dtos/course-snapshot.dto';
import { PreceptorDashboardResponseDto } from '../../dtos/preceptor-dashboard.response.dto';
import { CourseSnapshotBuilderService } from '../../services/course-snapshot-builder.service';
import { GetPreceptorDashboardQuery } from './get-preceptor-dashboard.query';

@Injectable()
export class GetPreceptorDashboardQueryHandler {
	constructor(
		@Inject('ICoursePort')
		private readonly coursePort: ICoursePort,
		private readonly dashService: CourseSnapshotBuilderService,
		@Inject('IAcademicYearPort')
		private readonly academicYearPort: IAcademicYearPort,
	) {}
	async execute(
		query: GetPreceptorDashboardQuery,
	): Promise<PreceptorDashboardResponseDto> {
		const year = await this.academicYearPort.findActiveByTenant(query.tenantId);
		const courses = await this.coursePort.findByPreceptorId(query.preceptorId);
		const snapshots: CourseSnapshotDto[] = [];
		for (const course of courses) {
			const snapshot = await this.dashService.buildCourseSnapshot(
				course.id,
				year.startDate,
				new Date(Math.min(query.date.getTime(), year.endDate.getTime())),
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
