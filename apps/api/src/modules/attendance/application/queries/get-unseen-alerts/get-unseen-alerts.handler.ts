import { Inject } from '@nestjs/common';
import { ROLES } from '@repo/common';
import { ICoursePort } from '../../../domain/ports/courses.port.interface';
import { IStudentPort } from '../../../domain/ports/student.port.interface';
import { IAttendanceAlertRepository } from '../../../domain/repositories/attendance-alert.repository.interface';
import { AlertsListResponseDto } from '../../dtos/alert-list.response.dto';
import { AlertResponseDto } from '../../dtos/alert.response.dto';
import { GetUnseenAlertsQuery } from './get-unseen-alerts.query';

export class GetUnseenAlertsQueryHandler {
	constructor(
		@Inject('IAttendanceAlertRepository')
		private readonly alertRepo: IAttendanceAlertRepository,
		@Inject('ICoursePort')
		private readonly coursePort: ICoursePort,
		@Inject('IStudentPort')
		private readonly studentPort: IStudentPort,
	) {}
	async execute(query: GetUnseenAlertsQuery): Promise<AlertsListResponseDto> {
		let courseIds: string[] = [];
		if (query.role !== ROLES.ADMIN) {
			const courses = await this.coursePort.findByPreceptorId(query.preceptorId);
			courseIds = courses.map((c) => c.id);
			if (courseIds.length === 0) {
				return new AlertsListResponseDto([], 0, 0, 1, 20);
			}
		}

		const alerts = await this.alertRepo.findUnSeen(courseIds, query.tenantId);

		const alertDtos = await Promise.all(
			alerts.map(async (alert) => {
				const [student, course] = await Promise.all([
					this.studentPort.findById(alert.studentId),
					this.coursePort.findById(alert.courseId),
				]);
				return new AlertResponseDto(alert, student?.name ?? '', course?.name ?? '');
			}),
		);

		return new AlertsListResponseDto(
			alertDtos,
			alerts.length,
			alerts.length,
			1,
			Math.max(alerts.length, 1),
		);
	}
}
