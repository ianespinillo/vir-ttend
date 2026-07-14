import { ICoursePort } from '../../../domain/ports/courses.port.interface';
import { IAttendanceAlertRepository } from '../../../domain/repositories/attendance-alert.repository.interface';
import { AlertsCountResponseDto } from '../../dtos/alert-count.response.dto';
import { GetAlertsCountQuery } from './get-alerts-count.query';

export class GetAlertsCountQueryHandler {
	constructor(
		private readonly alertRepo: IAttendanceAlertRepository,
		private readonly coursePort: ICoursePort,
	) {}
	async execute(query: GetAlertsCountQuery): Promise<AlertsCountResponseDto> {
		const courses = await this.coursePort.findByPreceptorId(query.preceptorId);
		const alerts = await this.alertRepo.countUnSeen(courses.map((c) => c.id));
		return new AlertsCountResponseDto(alerts);
	}
}
