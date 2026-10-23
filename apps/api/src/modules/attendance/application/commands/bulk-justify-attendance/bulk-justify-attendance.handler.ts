import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ATTENDANCE_STATUS } from '@repo/common';
import { AttendanceRecord } from '../../../domain/entities/attendance-record.entity';
import { Justification } from '../../../domain/entities/justification.entity';
import { AttendanceJustifiedEvent } from '../../../domain/events/attendance-justified.event';
import { IAcademicYearPort } from '../../../domain/ports/academic-year.port.interface';
import { IUnitOfWorkPort } from '../../../domain/ports/unit-of-work.port.interface';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import { IJustificationRepository } from '../../../domain/repositories/justification.repository.interface';
import { JustificationService } from '../../../domain/services/justification.service';
import {
	BULK_JUSTIFICATION_NOT_FOUND,
	BulkJustificationFailure,
	bulkJustificationRejected,
} from '../../services/bulk-justification.failure';
import { BulkJustifyAttendanceCommand } from './bulk-justify-attendance.command';

/**
 * Justifies many attendance records (daily and subject rows share the table)
 * with one reason, all or nothing: every record is checked with the same rules
 * as the single justify first, and nothing is saved if any of them fails.
 */
@Injectable()
export class BulkJustifyAttendanceHandler {
	constructor(
		@Inject('IJustificationRepository')
		private readonly justificationRepo: IJustificationRepository,
		@Inject('IAttendanceRecordRepository')
		private readonly attendanceRepo: IAttendanceRecordRepository,
		private readonly events: EventEmitter2,
		@Inject('IAcademicYearPort')
		private readonly academicYearPort: IAcademicYearPort,
		@Inject('IUnitOfWorkPort')
		private readonly unitOfWork: IUnitOfWorkPort,
	) {}

	async execute(
		command: BulkJustifyAttendanceCommand,
	): Promise<{ justified: number }> {
		const found = new Map(
			(await this.attendanceRepo.findByIds(command.recordIds)).map((r) => [
				r.id,
				r,
			]),
		);
		const year = await this.academicYearPort.findActiveByTenant(command.tenantId);

		const failures: BulkJustificationFailure[] = [];
		const records: AttendanceRecord[] = [];
		for (const recordId of command.recordIds) {
			const record = found.get(recordId);
			// A record of another tenant is reported as missing, never revealed.
			if (!record || record.tenantId !== command.tenantId) {
				failures.push({ recordId, reason: BULK_JUSTIFICATION_NOT_FOUND });
			} else if (!year) {
				failures.push({ recordId, reason: 'No hay un ciclo lectivo activo' });
			} else if (!JustificationService.canJustify(record, year)) {
				failures.push({
					recordId,
					reason:
						'Solo se pueden justificar inasistencias o tardanzas del ciclo lectivo activo.',
				});
			} else {
				records.push(record);
			}
		}
		if (failures.length > 0) throw bulkJustificationRejected(failures);

		const justifications = await this.unitOfWork.run(async () => {
			const created: Justification[] = [];
			for (const record of records) {
				const justification = Justification.create({
					attendanceRecordId: record.id,
					createdBy: command.justifiedBy,
					reason: command.reason,
					notes: command.notes ?? undefined,
				});
				await this.justificationRepo.save(justification);
				record.updateStatus(ATTENDANCE_STATUS.JUSTIFIED, command.justifiedBy);
				await this.attendanceRepo.save(record);
				created.push(justification);
			}
			return created;
		});

		// Only after the transaction committed.
		records.forEach((record, i) => {
			this.events.emit(
				'justification',
				new AttendanceJustifiedEvent(new Date(), justifications[i], record),
			);
		});
		return { justified: records.length };
	}
}
