import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../../../common/errors';
import { IWorkshopCommissionPort } from '../../../domain/ports/workshop-commission.port.interface';
import { IWorkshopSessionNotHeldRepository } from '../../../domain/repositories/workshop-session-not-held.repository.interface';
import { WorkshopSessionNotHeldResponseDto } from '../../dtos/workshop-session-not-held.response.dto';
import { assertCanManageWorkshopAttendance } from '../../services/workshop-attendance-access.policy';
import { GetWorkshopSessionNotHeldQuery } from './get-workshop-session-not-held.query';

@Injectable()
export class GetWorkshopSessionNotHeldQueryHandler {
	constructor(
		@Inject('IWorkshopCommissionPort')
		private readonly commissionPort: IWorkshopCommissionPort,
		@Inject('IWorkshopSessionNotHeldRepository')
		private readonly notHeldRepo: IWorkshopSessionNotHeldRepository,
	) {}

	async execute(
		query: GetWorkshopSessionNotHeldQuery,
	): Promise<WorkshopSessionNotHeldResponseDto> {
		const commission = await this.commissionPort.findById(query.commissionId);
		if (!commission) throw new NotFoundError('Comisión no encontrada');
		assertCanManageWorkshopAttendance(commission, {
			userId: query.userId,
			role: query.role,
			tenantId: query.tenantId,
		});
		const marker = await this.notHeldRepo.findByCommissionAndDate(
			commission.id,
			query.date,
		);
		return new WorkshopSessionNotHeldResponseDto(marker !== null, marker?.reason);
	}
}
