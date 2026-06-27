import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

export class AttendanceRegisteredListener {
	private readonly logger = new Logger();
	@OnEvent('attendance.registered')
	async attendanceRegistered() {
		this.logger.log('AttendanceRegistered');
	}
}
