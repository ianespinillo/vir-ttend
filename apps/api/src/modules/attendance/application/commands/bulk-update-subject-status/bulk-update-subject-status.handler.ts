import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AttendanceRecord } from '../../../domain/entities/attendance-record.entity';
import { AttendanceRegisteredEvent } from '../../../domain/events/attendance-registered.event';
import { IStudentPort } from '../../../domain/ports/student.port.interface';
import { ISubjectPort } from '../../../domain/ports/subject.port.interface';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import { BulkUpdateSubjectStatusCommand } from './bulk-update-subject-status.command';

@Injectable()
export class BulkUpdateSubjectStatusHandler {
	constructor(
		private readonly attendanceRepo: IAttendanceRecordRepository,
		@Inject('ISubjectPort') private readonly subjectRepository: ISubjectPort,
		@Inject('IStudentPort') private readonly studentPort: IStudentPort,
		private readonly em: EventEmitter2,
	) {}
	async execute(command: BulkUpdateSubjectStatusCommand): Promise<void> {
		const subject = await this.subjectRepository.getSubjectById(
			command.subjectId,
		);
		if (!subject) throw new BadRequestException('Subject not found');
		const students = await this.studentPort.getByCourseId(subject.courseId);
		const results: AttendanceRecord[] = [];
		for (const student of students) {
			const attendanceRecord =
				await this.attendanceRepo.findByStudentAndCourseAndDate(
					subject.courseId,
					student.id,
					command.date,
				);
			if (attendanceRecord?.isSubject) {
				attendanceRecord.updateStatus(command.status, command.userId);
				results.push(attendanceRecord);
			}
			results.push(
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
		}
		await this.attendanceRepo.bulkSave(results);
		results.forEach((r) => {
			this.em.emit(
				'attendance.registered',
				new AttendanceRegisteredEvent(new Date(), r),
			);
		});
	}
}
