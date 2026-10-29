import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../../../common/errors';
import { IWorkshopCommissionPort } from '../../../domain/ports/workshop-commission.port.interface';
import { IWorkshopSessionNotHeldRepository } from '../../../domain/repositories/workshop-session-not-held.repository.interface';
import { assertCanManageWorkshopAttendance } from '../../services/workshop-attendance-access.policy';
import { UnmarkWorkshopSessionNotHeldCommand } from './unmark-workshop-session-not-held.command';

/**
 * Removes the not-held marker of a commission for a date, which reopens
 * registration. Idempotent: an unmarked day is a no-op. The records deleted
 * when the day was marked are not restored.
 */
@Injectable()
export class UnmarkWorkshopSessionNotHeldHandler {
	constructor(
		@Inject('IWorkshopCommissionPort')
		private readonly commissionPort: IWorkshopCommissionPort,
		@Inject('IWorkshopSessionNotHeldRepository')
		private readonly notHeldRepo: IWorkshopSessionNotHeldRepository,
	) {}

	async execute(command: UnmarkWorkshopSessionNotHeldCommand): Promise<void> {
		const commission = await this.commissionPort.findById(command.commissionId);
		if (!commission) throw new NotFoundError('Comisión no encontrada');
		assertCanManageWorkshopAttendance(commission, {
			userId: command.userId,
			role: command.role,
			tenantId: command.tenantId,
		});
		await this.notHeldRepo.delete(commission.id, command.date);
	}
}
