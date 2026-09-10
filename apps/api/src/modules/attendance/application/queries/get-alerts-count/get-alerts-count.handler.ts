import { Inject } from '@nestjs/common';
import { ROLES } from '@repo/common';
import { ICoursePort } from '../../../domain/ports/courses.port.interface';
import { IAttendanceAlertRepository } from '../../../domain/repositories/attendance-alert.repository.interface';
import { AlertsCountResponseDto } from '../../dtos/alert-count.response.dto';
import { GetAlertsCountQuery } from './get-alerts-count.query';

export class GetAlertsCountQueryHandler {
	constructor(
		@Inject('IAttendanceAlertRepository')
		private readonly alertRepo: IAttendanceAlertRepository,
		@Inject('ICoursePort')
		private readonly coursePort: ICoursePort,
	) {}
	async execute(query: GetAlertsCountQuery): Promise<AlertsCountResponseDto> {
		let courseIds: string[] = [];
		if (query.role !== ROLES.ADMIN) {
			const courses = await this.coursePort.findByPreceptorId(query.preceptorId);
			courseIds = courses.map((c) => c.id);
			if (courseIds.length === 0) {
				return new AlertsCountResponseDto(0);
			}
		}

		const alerts = await this.alertRepo.countUnSeen(courseIds, query.tenantId);
		return new AlertsCountResponseDto(alerts);
	}
}
