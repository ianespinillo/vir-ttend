import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GenerateAlertCommand } from '../../application/commands/generate-alert/generate-alert.command';
import { GenerateAlertHandler } from '../../application/commands/generate-alert/generate-alert.handler';
import { AttendanceRegisteredEvent } from '../../domain/events/attendance-registered.event';
import { IAcademicYearPort } from '../../domain/ports/academic-year.port.interface';

@Injectable()
export class AttendanceRegisteredListener {
	private readonly logger = new Logger(AttendanceRegisteredEvent.name);
	constructor(
		private readonly academicYearPort: IAcademicYearPort,
		private readonly generateAlertHandler: GenerateAlertHandler,
	) {}
	@OnEvent('attendance.registered')
	async attendanceRegistered(eventData: AttendanceRegisteredEvent) {
		const year = await this.academicYearPort.findByCourseId(
			eventData.attendance.courseId,
		);
		if (!year) {
			this.logger.warn(
				`No academic year found for course ${eventData.attendance.courseId}. Skipping alert generation.`,
			);
			return;
		}
		const commandData = new GenerateAlertCommand(
			eventData.attendance.studentId,
			eventData.attendance.courseId,
			year.id,
			eventData.attendance.tenantId,
		);
		await this.generateAlertHandler.execute(commandData);
		this.logger.verbose('Attendance registered successfully.');
	}
}
