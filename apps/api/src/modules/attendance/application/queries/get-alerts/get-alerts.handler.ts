import { Inject } from '@nestjs/common';
import { ROLES } from '@repo/common';
import { ICoursePort } from '../../../domain/ports/courses.port.interface';
import { IStudentPort } from '../../../domain/ports/student.port.interface';
import { IAttendanceAlertRepository } from '../../../domain/repositories/attendance-alert.repository.interface';
import { AlertsListResponseDto } from '../../dtos/alert-list.response.dto';
import { AlertResponseDto } from '../../dtos/alert.response.dto';
import { GetAlertsQuery } from './get-alerts.query';

export class GetAlertsQueryHandler {
	constructor(
		@Inject('IAttendanceAlertRepository')
		private readonly repo: IAttendanceAlertRepository,
		@Inject('ICoursePort')
		private readonly coursePort: ICoursePort,
		@Inject('IStudentPort')
		private readonly studentPort: IStudentPort,
	) {}
	async execute(query: GetAlertsQuery): Promise<AlertsListResponseDto> {
		const perPage = query.limit ?? 20;
		let courseIds: string[] = [];
		const tenantId: string | undefined = query.tenantId;

		if (query.role === ROLES.ADMIN) {
			if (query.courseId) {
				courseIds = [query.courseId];
			}
		} else {
			const courses = await this.coursePort.findByPreceptorId(query.preceptorId);
			const assignedCourseIds = courses.map((c) => c.id);
			if (query.courseId) {
				if (!assignedCourseIds.includes(query.courseId)) {
					return new AlertsListResponseDto([], 0, 0, query.page, perPage);
				}
				courseIds = [query.courseId];
			} else {
				courseIds = assignedCourseIds;
				if (courseIds.length === 0) {
					return new AlertsListResponseDto([], 0, 0, query.page, perPage);
				}
			}
		}

		const alerts = await this.repo.findByPreceptor(
			courseIds,
			{
				page: query.page,
				perPage,
			},
			query.alertType ?? undefined,
			tenantId,
		);

		const alertDtos = await Promise.all(
			alerts.items.map(async (alert) => {
				const [student, course] = await Promise.all([
					this.studentPort.findById(alert.studentId),
					this.coursePort.findById(alert.courseId),
				]);
				return new AlertResponseDto(alert, student?.name ?? '', course?.name ?? '');
			}),
		);

		return new AlertsListResponseDto(
			alertDtos,
			alerts.total,
			alerts.items.filter((a) => a.seenAt == null).length,
			query.page,
			perPage,
		);
	}
}
