import { Inject, Injectable } from '@nestjs/common';
import { DomainError, NotFoundError } from '../../../../../common/errors';
import { AttendanceRecord } from '../../../domain/entities/attendance-record.entity';
import { ISubjectPort } from '../../../domain/ports/subject.port.interface';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import { AttendanceCopyService } from '../../services/attendance-copy.service';
import { assertCanWriteSubjectAttendance } from '../../services/subject-access.policy';
import { CopyAttendanceCommand } from './copy-attendance.command';

@Injectable()
export class CopyAttendanceHandler {
	constructor(
		@Inject('IAttendanceRecordRepository')
		private readonly attendanceRepo: IAttendanceRecordRepository,
		private readonly copyAttendanceService: AttendanceCopyService,
		@Inject('ISubjectPort')
		private readonly subjectPort: ISubjectPort,
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
		for (const record of sourceRecords) {
			if (!existingsIds.has(record.studentId)) {
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
