import { Inject, Injectable } from '@nestjs/common';
import { DomainError, NotFoundError } from '../../../../../common/errors';
import { AttendanceRecord } from '../../../domain/entities/attendance-record.entity';
import { ISubjectPort } from '../../../domain/ports/subject.port.interface';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import { AttendanceCopyService } from '../../services/attendance-copy.service';
import { assertCanWriteSubjectAttendance } from '../../services/subject-access.policy';
import { SubjectRosterService } from '../../services/subject-roster.service';
import { CopyAttendanceCommand } from './copy-attendance.command';

@Injectable()
export class CopyAttendanceHandler {
	constructor(
		@Inject('IAttendanceRecordRepository')
		private readonly attendanceRepo: IAttendanceRecordRepository,
		private readonly copyAttendanceService: AttendanceCopyService,
		@Inject('ISubjectPort')
		private readonly subjectPort: ISubjectPort,
		private readonly rosterService: SubjectRosterService,
	) {}
	async execute(command: CopyAttendanceCommand): Promise<void> {
		const subject = await this.subjectPort.getSubjectById(command.subjectId);
		if (!subject) throw new NotFoundError('Materia no encontrada');
		assertCanWriteSubjectAttendance(subject, {
			userId: command.userId,
			role: command.userRole,
			tenantId: command.tenantId,
		});
		const sourceRecords = await this.copyAttendanceService.getLastClassRecords(
			command.subjectId,
			command.sourceDate ?? command.targetDate,
		);
		if (sourceRecords.length === 0)
			throw new DomainError(
				'No se encontraron registros de asistencia para la fecha de origen',
			);
		const result: AttendanceRecord[] = [];
		const existingRecords = await this.attendanceRepo.findBySubjectAndDate(
			command.subjectId,
			command.targetDate,
		);
		const existingsIds = new Set(
			existingRecords.map((record) => record.studentId),
		);
		// Only students who attend the subject on the target date: the source class
		// may belong to the other commission of a mixed-slot workshop subject.
		const roster = await this.rosterService.getActiveRoster(
			subject,
			command.targetDate,
		);
		const rosterIds = new Set(roster.map((student) => student.id));
		for (const record of sourceRecords) {
			if (rosterIds.has(record.studentId) && !existingsIds.has(record.studentId)) {
				result.push(
					AttendanceRecord.create({
						tenantId: command.tenantId,
						courseId: record.courseId,
						studentId: record.studentId,
						subjectId: command.subjectId,
						date: command.targetDate,
						status: record.status,
						editedBy: command.userId,
					}),
				);
			}
		}
		if (result.length > 0) await this.attendanceRepo.bulkSave(result);
		//Todo: Emit event
	}
}
