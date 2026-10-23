import { Inject, Injectable } from '@nestjs/common';
import { ATTENDANCE_STATUS } from '@repo/common';
import { ForbiddenError } from '../../../../../common/errors';
import { WorkshopAttendanceRecord } from '../../../domain/entities/workshop-attendance-record.entity';
import { WorkshopJustification } from '../../../domain/entities/workshop-justification.entity';
import { IAcademicYearPort } from '../../../domain/ports/academic-year.port.interface';
import { IUnitOfWorkPort } from '../../../domain/ports/unit-of-work.port.interface';
import {
	IWorkshopCommissionPort,
	WorkshopCommissionInfo,
} from '../../../domain/ports/workshop-commission.port.interface';
import { IWorkshopAttendanceRecordRepository } from '../../../domain/repositories/workshop-attendance-record.repository.interface';
import { IWorkshopJustificationRepository } from '../../../domain/repositories/workshop-justification.repository.interface';
import { JustificationService } from '../../../domain/services/justification.service';
import {
	BULK_JUSTIFICATION_NOT_FOUND,
	BulkJustificationFailure,
	bulkJustificationRejected,
} from '../../services/bulk-justification.failure';
import { assertCanManageWorkshopAttendance } from '../../services/workshop-attendance-access.policy';
import { BulkJustifyWorkshopAttendanceCommand } from './bulk-justify-workshop-attendance.command';

/**
 * Justifies many workshop records with one reason, all or nothing. Each record
 * goes through the same rules as the single justify (commission access policy
 * and academic year); nothing is saved if any record fails.
 */
@Injectable()
export class BulkJustifyWorkshopAttendanceHandler {
	constructor(
		@Inject('IWorkshopJustificationRepository')
		private readonly justificationRepo: IWorkshopJustificationRepository,
		@Inject('IWorkshopAttendanceRecordRepository')
		private readonly attendanceRepo: IWorkshopAttendanceRecordRepository,
		@Inject('IWorkshopCommissionPort')
		private readonly commissionPort: IWorkshopCommissionPort,
		@Inject('IAcademicYearPort')
		private readonly academicYearPort: IAcademicYearPort,
		@Inject('IUnitOfWorkPort')
		private readonly unitOfWork: IUnitOfWorkPort,
	) {}

	async execute(
		command: BulkJustifyWorkshopAttendanceCommand,
	): Promise<{ justified: number }> {
		const found = new Map(
			(await this.attendanceRepo.findByIds(command.recordIds)).map((r) => [
				r.id,
				r,
			]),
		);
		const year = await this.academicYearPort.findActiveByTenant(command.tenantId);
		const commissions = new Map<string, WorkshopCommissionInfo | null>();
		const commissionOf = async (id: string) => {
			if (!commissions.has(id)) {
				commissions.set(id, await this.commissionPort.findById(id));
			}
			return commissions.get(id) ?? null;
		};

		const failures: BulkJustificationFailure[] = [];
		const records: WorkshopAttendanceRecord[] = [];
		for (const recordId of command.recordIds) {
			const record = found.get(recordId);
			if (!record || record.tenantId !== command.tenantId) {
				failures.push({ recordId, reason: BULK_JUSTIFICATION_NOT_FOUND });
				continue;
			}
			const commission = await commissionOf(record.workshopCommissionId);
			if (!commission) {
				failures.push({ recordId, reason: 'Comisión no encontrada' });
				continue;
			}
			try {
				assertCanManageWorkshopAttendance(commission, {
					userId: command.userId,
					role: command.role,
					tenantId: command.tenantId,
				});
			} catch (error) {
				if (!(error instanceof ForbiddenError)) throw error;
				failures.push({ recordId, reason: error.message });
				continue;
			}
			if (!year) {
				failures.push({ recordId, reason: 'No hay un ciclo lectivo activo' });
			} else if (!JustificationService.canJustifyWorkshop(record, year)) {
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

		await this.unitOfWork.run(async () => {
			for (const record of records) {
				await this.justificationRepo.save(
					WorkshopJustification.create({
						workshopAttendanceRecordId: record.id,
						createdBy: command.userId,
						reason: command.reason,
						notes: command.notes ?? undefined,
					}),
				);
				record.updateStatus(ATTENDANCE_STATUS.JUSTIFIED, command.userId);
			}
			await this.attendanceRepo.bulkSave(records);
		});
		return { justified: records.length };
	}
}
