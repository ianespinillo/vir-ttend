import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DAYOFWEEK } from '@repo/common';
import { AttendanceRecord } from '../../../domain/entities/attendance-record.entity';
import { AttendanceRegisteredEvent } from '../../../domain/events/attendance-registered.event';
import { ISchedulePort } from '../../../domain/ports/schedule.port.interface';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import { RegisterSubjectAttendanceCommand } from './register-subject-attendance.command';

@Injectable()
export class RegisterSubjectAttendanceHandler {
	constructor(
		private readonly attendanceRecordRepo: IAttendanceRecordRepository,
		private readonly schedulePort: ISchedulePort,
		private readonly em: EventEmitter2,
	) {}
	async execute(command: RegisterSubjectAttendanceCommand): Promise<void> {
		const slots = await this.schedulePort.findBySubject(command.subjectId);
		const validDays = slots.filter(
			(s) => s.dayOfWeek === this.getDayOfWeek(command.date),
		);
		if (validDays.length === 0)
			throw new BadRequestException('Invalid class day for this subject');
		const existingRecords = await this.attendanceRecordRepo.findBySubjectAndDate(
			command.subjectId,
			command.date,
		);
		const mappedRecords = new Map(existingRecords.map((r) => [r.studentId, r]));
		const finalRecords: AttendanceRecord[] = [];
		for (const record of command.records) {
			const exist = mappedRecords.get(record.studentId);
			if (exist) {
				exist.updateStatus(record.status, command.userId);
				finalRecords.push(exist);
			}
			finalRecords.push(
				AttendanceRecord.create({
					tenantId: command.tenantId,
					courseId: command.courseId,
					studentId: record.studentId,
					subjectId: command.subjectId,
					date: command.date,
					status: record.status,
					editedBy: command.userId,
				}),
			);
		}
		if (finalRecords.length > 0) {
			await this.attendanceRecordRepo.bulkSave(finalRecords);
			finalRecords.forEach((recordedRecord) =>
				this.em.emit(
					'attendance.registered',
					new AttendanceRegisteredEvent(new Date(), recordedRecord),
				),
			);
		}
	}
	private getDayOfWeek(date: Date): DAYOFWEEK {
		const days: Record<number, DAYOFWEEK> = {
			1: DAYOFWEEK.MONDAY,
			2: DAYOFWEEK.TUESDAY,
			3: DAYOFWEEK.WEDNESDAY,
			4: DAYOFWEEK.THURSDAY,
			5: DAYOFWEEK.FRIDAY,
		};
		return days[date.getDay()];
	}
}
