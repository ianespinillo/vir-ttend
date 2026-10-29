import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../../../common/errors';
import { WorkshopSessionNotHeld } from '../../../domain/entities/workshop-session-not-held.entity';
import { IUnitOfWorkPort } from '../../../domain/ports/unit-of-work.port.interface';
import { IWorkshopCommissionPort } from '../../../domain/ports/workshop-commission.port.interface';
import { IWorkshopAttendanceRecordRepository } from '../../../domain/repositories/workshop-attendance-record.repository.interface';
import { IWorkshopSessionNotHeldRepository } from '../../../domain/repositories/workshop-session-not-held.repository.interface';
import { assertCanManageWorkshopAttendance } from '../../services/workshop-attendance-access.policy';
import { MarkWorkshopSessionNotHeldCommand } from './mark-workshop-session-not-held.command';

/**
 * Marks the workshop of a commission as not held on a date. The workshop
 * records already saved for that day are deleted (the caller confirms first)
 * and registering new ones is blocked until the marker is removed. Idempotent:
 * marking an already marked day only updates the reason.
 */
@Injectable()
export class MarkWorkshopSessionNotHeldHandler {
	constructor(
		@Inject('IWorkshopCommissionPort')
		private readonly commissionPort: IWorkshopCommissionPort,
		@Inject('IWorkshopSessionNotHeldRepository')
		private readonly notHeldRepo: IWorkshopSessionNotHeldRepository,
		@Inject('IWorkshopAttendanceRecordRepository')
		private readonly attendanceRepo: IWorkshopAttendanceRecordRepository,
		@Inject('IUnitOfWorkPort')
		private readonly unitOfWork: IUnitOfWorkPort,
	) {}

	async execute(
		command: MarkWorkshopSessionNotHeldCommand,
	): Promise<{ deletedRecords: number }> {
		const commission = await this.commissionPort.findById(command.commissionId);
		if (!commission) throw new NotFoundError('Comisión no encontrada');
		assertCanManageWorkshopAttendance(commission, {
			userId: command.userId,
			role: command.role,
			tenantId: command.tenantId,
		});

		const reason = command.reason?.trim() || undefined;
		return this.unitOfWork.run(async () => {
			const deletedRecords = await this.attendanceRepo.deleteByCommissionAndDate(
				commission.id,
				command.date,
			);
			const existing = await this.notHeldRepo.findByCommissionAndDate(
				commission.id,
				command.date,
			);
			if (existing) {
				if (existing.reason !== reason) {
					existing.changeReason(reason);
					await this.notHeldRepo.save(existing);
				}
			} else {
				await this.notHeldRepo.save(
					WorkshopSessionNotHeld.create({
						tenantId: commission.tenantId,
						workshopCommissionId: commission.id,
						date: command.date,
						reason,
						createdBy: command.userId,
					}),
				);
			}
			return { deletedRecords };
		});
	}
}
