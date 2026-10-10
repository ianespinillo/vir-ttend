import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AttendanceRecord } from '../../../domain/entities/attendance-record.entity';
import { AttendanceRegisteredEvent } from '../../../domain/events/attendance-registered.event';
import { IStudentPort } from '../../../domain/ports/student.port.interface';
import { ISubjectPort } from '../../../domain/ports/subject.port.interface';
import { IUnitOfWorkPort } from '../../../domain/ports/unit-of-work.port.interface';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import { assertCanWriteSubjectAttendance } from '../../services/subject-access.policy';
import { BulkUpdateSubjectStatusCommand } from './bulk-update-subject-status.command';

/**
 * Sets the same status for every student of the subject's course. Idempotent:
 * only subject records that were created or whose status changed are saved and
 * announced. It only ever reads/writes records of this subject, never daily ones.
 */
@Injectable()
export class BulkUpdateSubjectStatusHandler {
	constructor(
		@Inject('IAttendanceRecordRepository')
		private readonly attendanceRepo: IAttendanceRecordRepository,
		@Inject('ISubjectPort') private readonly subjectRepository: ISubjectPort,
		@Inject('IStudentPort') private readonly studentPort: IStudentPort,
		@Inject('IUnitOfWorkPort')
		private readonly unitOfWork: IUnitOfWorkPort,
		private readonly em: EventEmitter2,
	) {}
	async execute(command: BulkUpdateSubjectStatusCommand): Promise<void> {
		const subject = await this.subjectRepository.getSubjectById(
			command.subjectId,
		);
		if (!subject) throw new BadRequestException('Subject not found');
		assertCanWriteSubjectAttendance(subject, {
			userId: command.userId,
			role: command.userRole,
		});
		const students = await this.studentPort.getByCourseId(subject.courseId);
		const changedRecords = await this.unitOfWork.run(async () => {
			const existingByStudent = new Map(
				(
					await this.attendanceRepo.findBySubjectAndDate(subject.id, command.date)
				).map((record) => [record.studentId, record]),
			);
			const changed: AttendanceRecord[] = [];
			for (const student of students) {
				const existing = existingByStudent.get(student.id);
				if (!existing) {
					changed.push(
						AttendanceRecord.create({
							tenantId: command.tenantId,
							courseId: subject.courseId,
							status: command.status,
							date: command.date,
							editedBy: command.userId,
							subjectId: subject.id,
							studentId: student.id,
						}),
					);
					continue;
				}
				if (existing.status === command.status) continue;
				existing.updateStatus(command.status, command.userId);
				changed.push(existing);
			}
			if (changed.length > 0) await this.attendanceRepo.bulkSave(changed);
			return changed;
		});
		for (const record of changedRecords) {
			this.em.emit(
				'attendance.registered',
				new AttendanceRegisteredEvent(new Date(), record),
			);
		}
	}
}
