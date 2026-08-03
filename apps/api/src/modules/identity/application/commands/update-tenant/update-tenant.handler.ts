import { Inject, Injectable } from '@nestjs/common';
import { ITenantRepository } from '../../../domain/repositories/tenant.repository.interface';
import { UpdateTenantCommand } from './update-tenant.command';

@Injectable()
export class UpdateTenantHandler {
	constructor(
		@Inject('ITenantRepository')
		private readonly tenantRepo: ITenantRepository,
	) {}
	async execute(command: UpdateTenantCommand) {
		const tenant = await this.tenantRepo.findById(command.tenantId);
		if (!tenant) throw new Error('Tenant not found');
		if (command.contactEmail) tenant.updateContactEmail(command.contactEmail);
		if (command.name) tenant.updateName(command.name);
		await this.tenantRepo.save(tenant);
	}
}
