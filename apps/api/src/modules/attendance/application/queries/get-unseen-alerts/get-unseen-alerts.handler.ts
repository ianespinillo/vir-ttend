import { ICoursePort } from '../../../domain/ports/courses.port.interface';
import { IAttendanceAlertRepository } from '../../../domain/repositories/attendance-alert.repository.interface';
import { AlertsListResponseDto } from '../../dtos/alert-list.response.dto';
import { GetUnseenAlertsQuery } from './get-unseen-alerts.query';

export class GetUnseenAlertsQueryHandler {
	constructor(
		private readonly alertRepo: IAttendanceAlertRepository,
		private readonly coursePort: ICoursePort,
	) {}
	async execute(query: GetUnseenAlertsQuery): Promise<AlertsListResponseDto> {
		const courses = await this.coursePort.findByPreceptorId(query.preceptorId);
		const alerts = await this.alertRepo.findUnSeen(courses.map((c) => c.id));

		return new AlertsListResponseDto(alerts, alerts.length, alerts.length);
	}
}
