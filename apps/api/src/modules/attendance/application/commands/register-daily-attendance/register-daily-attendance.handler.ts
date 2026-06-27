import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AttendanceRecord } from '../../../domain/entities/attendance-record.entity';
import { AttendanceRegisteredEvent } from '../../../domain/events/attendance-registered.event';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import { RegisterDailyAttendanceCommand } from './register-daily-attendance.command';

@Injectable()
export class RegisterDailyAttendanceHandler {
	constructor(
		private readonly attendanceRepo: IAttendanceRecordRepository,
		private readonly em: EventEmitter2,
	) {}
	async execute(command: RegisterDailyAttendanceCommand): Promise<void> {
		const cleanRecords: AttendanceRecord[] = [];
		for (const record of command.records) {
			const existingRecord =
				await this.attendanceRepo.findByStudentAndCourseAndDate(
					command.courseId,
					record.studentId,
					command.date,
				);
			if (existingRecord) {
				existingRecord.updateStatus(record.status, command.editedBy);
				cleanRecords.push(existingRecord);
				continue;
			}
			cleanRecords.push(
				AttendanceRecord.create({
					tenantId: command.tenantId,
					courseId: command.courseId,
					date: command.date,
					status: record.status,
					editedBy: command.editedBy,
					studentId: record.studentId,
				}),
			);
		}
		await this.attendanceRepo.bulkSave(cleanRecords);
		cleanRecords.map((cleanRecord) =>
			this.em.emit(
				'register-daily-attendance',
				new AttendanceRegisteredEvent(new Date(Date.now()), cleanRecord),
			),
		);
	}
}
