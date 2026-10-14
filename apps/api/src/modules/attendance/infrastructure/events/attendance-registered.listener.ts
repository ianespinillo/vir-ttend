import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GenerateAlertCommand } from '../../application/commands/generate-alert/generate-alert.command';
import { GenerateAlertHandler } from '../../application/commands/generate-alert/generate-alert.handler';
import { AttendanceRegisteredEvent } from '../../domain/events/attendance-registered.event';
import { IAcademicYearPort } from '../../domain/ports/academic-year.port.interface';
import { toDateKey } from '../../domain/services/weighted-absence';

@Injectable()
export class AttendanceRegisteredListener {
	private readonly logger = new Logger(AttendanceRegisteredEvent.name);
	constructor(
		@Inject('IAcademicYearPort')
		private readonly academicYearPort: IAcademicYearPort,
		private readonly generateAlertHandler: GenerateAlertHandler,
	) {}
	/**
	 * Daily, subject and workshop saves all land here. Alert generation never
	 * fails the save that announced it: errors are logged and swallowed.
	 */
	@OnEvent('attendance.registered')
	async attendanceRegistered(eventData: AttendanceRegisteredEvent) {
		try {
			const year = await this.academicYearPort.findByCourseId(
				eventData.attendance.courseId,
			);
			if (!year) {
				this.logger.warn(
					`No academic year found for course ${eventData.attendance.courseId}. Skipping alert generation.`,
				);
				return;
			}
			await this.generateAlertHandler.execute(
				new GenerateAlertCommand(
					eventData.attendance.studentId,
					eventData.attendance.courseId,
					year.id,
					eventData.attendance.tenantId,
					toDateKey(eventData.attendance.date),
				),
			);
			this.logger.verbose('Attendance registered successfully.');
		} catch (error) {
			this.logger.error(
				`Alert generation failed for student ${eventData.attendance.studentId}`,
				error instanceof Error ? error.stack : String(error),
			);
		}
	}
}
