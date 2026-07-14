import { ICoursePort } from '../../../domain/ports/courses.port.interface';
import { IAttendanceAlertRepository } from '../../../domain/repositories/attendance-alert.repository.interface';
import { AlertsListResponseDto } from '../../dtos/alert-list.response.dto';
import { GetAlertsQuery } from './get-alerts.query';

export class GetAlertsQueryHandler {
	constructor(
		private readonly repo: IAttendanceAlertRepository,
		private readonly coursePort: ICoursePort,
	) {}
	async execute(query: GetAlertsQuery): Promise<AlertsListResponseDto> {
		const courses = await this.coursePort.findByPreceptorId(query.preceptorId);
		const alerts = await this.repo.findByPreceptor(
			courses.map((c) => c.id),
			{
				page: query.page,
				perPage: query.page ?? 10,
			},
			query.alertType ?? undefined,
		);
		return new AlertsListResponseDto(
			alerts.items,
			alerts.items.length,
			alerts.items.filter((a) => a.seenAt == null).length,
		);
	}
}
