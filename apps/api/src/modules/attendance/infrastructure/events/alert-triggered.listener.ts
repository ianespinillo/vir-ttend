import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AttendanceAlert } from '../../domain/entities/attendance-alert.entity';

export class AlertTriggeredListener {
	private readonly logger = new Logger();

	@OnEvent('alert.triggered')
	execute(event: AttendanceAlert) {
		this.logger.log(
			`Attendance alert triggered for student ${event.studentId}, category: ${event.alertType}`,
		);
	}
}
