import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AttendanceStatus, DAYOFWEEK } from '@repo/common';
import { AttendanceRecord } from '../../../domain/entities/attendance-record.entity';
import { AttendanceRegisteredEvent } from '../../../domain/events/attendance-registered.event';
import { ISchedulePort } from '../../../domain/ports/schedule.port.interface';
import { ISubjectPort } from '../../../domain/ports/subject.port.interface';
import { IUnitOfWorkPort } from '../../../domain/ports/unit-of-work.port.interface';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import { assertCanWriteSubjectAttendance } from '../../services/subject-access.policy';
import { RegisterSubjectAttendanceCommand } from './register-subject-attendance.command';

@Injectable()
export class RegisterSubjectAttendanceHandler {
	constructor(
		@Inject('IAttendanceRecordRepository')
		private readonly attendanceRecordRepo: IAttendanceRecordRepository,
		@Inject('ISchedulePort')
		private readonly schedulePort: ISchedulePort,
		@Inject('ISubjectPort')
		private readonly subjectPort: ISubjectPort,
		@Inject('IUnitOfWorkPort')
		private readonly unitOfWork: IUnitOfWorkPort,
		private readonly em: EventEmitter2,
	) {}
	async execute(command: RegisterSubjectAttendanceCommand): Promise<void> {
		const subject = await this.subjectPort.getSubjectById(command.subjectId);
		if (!subject) throw new BadRequestException('Invalid subject id');
		assertCanWriteSubjectAttendance(subject, {
			userId: command.userId,
			role: command.userRole,
			tenantId: command.tenantId,
		});
		if (command.courseId && command.courseId !== subject.courseId) {
			throw new BadRequestException('Course does not match subject');
		}
		const slots = await this.schedulePort.findBySubject(command.subjectId);
		const validDays = slots.filter(
			(s) => s.dayOfWeek === this.getDayOfWeek(command.date),
		);
		if (validDays.length === 0)
			throw new BadRequestException('Invalid class day for this subject');
		// Idempotent: replaying the same payload saves nothing and emits no event.
		const changedRecords = await this.unitOfWork.run(async () => {
			const existingRecords = await this.attendanceRecordRepo.findBySubjectAndDate(
				command.subjectId,
				command.date,
			);
			const mappedRecords = new Map(existingRecords.map((r) => [r.studentId, r]));
			// Last entry wins when a student appears more than once in the payload.
			const requestedStatus = new Map<string, AttendanceStatus>(
				command.records.map((record) => [record.studentId, record.status]),
			);
			const changed: AttendanceRecord[] = [];
			for (const [studentId, status] of requestedStatus) {
				const exist = mappedRecords.get(studentId);
				if (!exist) {
					changed.push(
						AttendanceRecord.create({
							tenantId: command.tenantId,
							courseId: subject.courseId,
							studentId,
							subjectId: command.subjectId,
							date: command.date,
							status,
							editedBy: command.userId,
						}),
					);
					continue;
				}
				if (exist.status === status) continue;
				exist.updateStatus(status, command.userId);
				changed.push(exist);
			}
			if (changed.length > 0) await this.attendanceRecordRepo.bulkSave(changed);
			return changed;
		});
		for (const recordedRecord of changedRecords) {
			this.em.emit(
				'attendance.registered',
				new AttendanceRegisteredEvent(new Date(), recordedRecord),
			);
		}
	}
	/**
	 * Class dates travel as `YYYY-MM-DD`, which `new Date()` parses as UTC
	 * midnight, so the weekday must be read in UTC. `getDay()` would shift it by
	 * the server timezone and reject valid class days.
	 */
	private getDayOfWeek(date: Date): DAYOFWEEK {
		const days: Record<number, DAYOFWEEK> = {
			1: DAYOFWEEK.MONDAY,
			2: DAYOFWEEK.TUESDAY,
			3: DAYOFWEEK.WEDNESDAY,
			4: DAYOFWEEK.THURSDAY,
			5: DAYOFWEEK.FRIDAY,
		};
		return days[date.getUTCDay()];
	}
}
