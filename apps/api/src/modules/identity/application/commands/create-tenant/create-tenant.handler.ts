import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Tenant } from '../../../domain/entities/tenant.entity';
import { TenantCreatedEvent } from '../../../domain/events/tenant-created.event';
import { ITenantRepository } from '../../../domain/repositories/tenant.repository.interface';
import { TenantResponseDto } from '../../dto/tenant.response.dto';
import { CreateTenantCommand } from './create-tenant.command';

@Injectable()
export class CreateTenantHandler {
	constructor(
		private readonly tenantRepo: ITenantRepository,
		private readonly em: EventEmitter2,
	) {}
	async execute(command: CreateTenantCommand): Promise<TenantResponseDto> {
		const exist = await this.tenantRepo.findBySubdomain(command.subdomain);
		if (exist) throw new Error('Tenant with this subdomain already exists');
		const newTenant = Tenant.create(command);
		await this.tenantRepo.save(newTenant);
		this.em.emit(
			'tenant.created',
			new TenantCreatedEvent(command.name, command.subdomain),
		);
		return new TenantResponseDto(
			newTenant.id,
			newTenant.name,
			newTenant.subdomain.getRaw(),
			newTenant.contatEmail.getValue(),
			newTenant.isActive,
			newTenant.createdAt,
		);
	}
}
