import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../../../common/errors';
import { ITenantRepository } from '../../../domain/repositories/tenant.repository.interface';
import { ToggleTenantStatusCommand } from './toggle-tenant-status.command';

@Injectable()
export class ToggleTenantStatusHandler {
	constructor(
		@Inject('ITenantRepository')
		private readonly tenantRepo: ITenantRepository,
	) {}
	async execute({ tenantId, isActive }: ToggleTenantStatusCommand) {
		const tenant = await this.tenantRepo.findById(tenantId);
		if (!tenant) throw new NotFoundError('Institución no encontrada.');
		if (isActive) tenant.activate();
		tenant.deactivate();
		await this.tenantRepo.save(tenant);
	}
}
