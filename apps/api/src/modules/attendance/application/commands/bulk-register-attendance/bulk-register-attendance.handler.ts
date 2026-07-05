import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AttendanceRecord } from '../../../domain/entities/attendance-record.entity';
import { AttendanceRegisteredEvent } from '../../../domain/events/attendance-registered.event';
import { IStudentPort } from '../../../domain/ports/student.port.interface';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import { BulkRegisterAttendanceCommand } from './bulk-register-attendance.command';
@Injectable()
export class BulkRegisterAttendanceHandler {
	constructor(
		private readonly attendanceRepo: IAttendanceRecordRepository,
		private readonly em: EventEmitter2,
		private readonly studentFinder: IStudentPort,
	) {}
	async execute(command: BulkRegisterAttendanceCommand): Promise<void> {
		const students = await this.studentFinder.getByCourseId(command.courseId);
		const records = await Promise.all(
			students.map(async (student) => {
				const existing = await this.attendanceRepo.findByStudentAndCourseAndDate(
					command.courseId,
					student.id,
					command.date,
				);
				if (existing) {
					existing.updateStatus(command.defaultStatus, command.editedBy);
					return existing;
				}
				return AttendanceRecord.create({
					tenantId: command.tenantId,
					courseId: command.courseId,
					studentId: student.id,
					status: command.defaultStatus,
					date: command.date,
					editedBy: command.editedBy,
				});
			}),
		);
		await this.attendanceRepo.bulkSave(records);
		records.forEach((r) => {
			this.em.emit(
				'attendance.registered',
				new AttendanceRegisteredEvent(new Date(), r),
			);
		});
	}
}
