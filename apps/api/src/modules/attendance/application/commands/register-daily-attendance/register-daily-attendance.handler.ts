import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AttendanceStatus } from '@repo/common';
import { AttendanceRecord } from '../../../domain/entities/attendance-record.entity';
import { AttendanceRegisteredEvent } from '../../../domain/events/attendance-registered.event';
import { ICoursePort } from '../../../domain/ports/courses.port.interface';
import { IUnitOfWorkPort } from '../../../domain/ports/unit-of-work.port.interface';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import { assertCourseHasDailyAttendance } from '../../services/daily-attendance.policy';
import { RegisterDailyAttendanceCommand } from './register-daily-attendance.command';

/**
 * Registers daily attendance. Idempotent: replaying the same payload creates
 * no rows, saves nothing and emits no event; only records that were created or
 * whose status changed are persisted and announced.
 */
@Injectable()
export class RegisterDailyAttendanceHandler {
	constructor(
		@Inject('IAttendanceRecordRepository')
		private readonly attendanceRepo: IAttendanceRecordRepository,
		@Inject('IUnitOfWorkPort')
		private readonly unitOfWork: IUnitOfWorkPort,
		private readonly em: EventEmitter2,
		@Inject('ICoursePort')
		private readonly coursePort: ICoursePort,
	) {}
	async execute(command: RegisterDailyAttendanceCommand): Promise<void> {
		await assertCourseHasDailyAttendance(this.coursePort, command.courseId);
		const changedRecords = await this.unitOfWork.run(async () => {
			const existingByStudent = new Map(
				(
					await this.attendanceRepo.findDailyByCourseAndDate(
						command.courseId,
						command.date,
					)
				).map((record) => [record.studentId, record]),
			);
			// Last entry wins when a student appears more than once in the payload.
			const requestedStatus = new Map<string, AttendanceStatus>(
				command.records.map((record) => [record.studentId, record.status]),
			);

			const changed: AttendanceRecord[] = [];
			for (const [studentId, status] of requestedStatus) {
				const existingRecord = existingByStudent.get(studentId);
				if (!existingRecord) {
					changed.push(
						AttendanceRecord.create({
							tenantId: command.tenantId,
							courseId: command.courseId,
							date: command.date,
							status,
							editedBy: command.editedBy,
							studentId,
						}),
					);
					continue;
				}
				if (existingRecord.status === status) continue;
				existingRecord.updateStatus(status, command.editedBy);
				changed.push(existingRecord);
			}

			if (changed.length > 0) await this.attendanceRepo.bulkSave(changed);
			return changed;
		});

		// Events are emitted once the transaction committed, and only for changes.
		for (const record of changedRecords) {
			this.em.emit(
				'attendance.registered',
				new AttendanceRegisteredEvent(new Date(Date.now()), record),
			);
		}
	}
}
