import { Injectable } from '@nestjs/common';
import { ITenantRepository } from '../../../domain/repositories/tenant.repository.interface';
import { ToggleTenantStatusCommand } from './toggle-tenant-status.command';

@Injectable()
export class ToggleTenantStatusHandler {
	constructor(private readonly tenantRepo: ITenantRepository) {}
	async execute({ tenantId, isActive }: ToggleTenantStatusCommand) {
		const tenant = await this.tenantRepo.findById(tenantId);
		if (!tenant) throw new Error('Tenant not founded');
		if (isActive) tenant.activate();
		tenant.deactivate();
		await this.tenantRepo.save(tenant);
	}
}
