import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AttendanceAlert } from '../../domain/entities/attendance-alert.entity';

@Injectable()
export class AlertTriggeredListener {
	private readonly logger = new Logger(AlertTriggeredListener.name);

	@OnEvent('alert.triggered')
	execute(event: AttendanceAlert) {
		this.logger.log(
			`Attendance alert triggered for student ${event.studentId}, type: ${event.alertType.status}, threshold: ${event.threshold}, absences: ${event.absenceCount}`,
		);
	}
}
