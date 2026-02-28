import { Injectable } from '@nestjs/common';
import { ITenantRepository } from '../../../domain/repositories/tenant.repository.interface';
import { TenantResponseDto } from '../../dto/tenant.response.dto';
import { ListTenantsQuery } from './list-tenants.query';

@Injectable()
export class ListTenantsHandler {
	constructor(private readonly tenantRepo: ITenantRepository) {}
	async execute(command: ListTenantsQuery): Promise<TenantResponseDto[]> {
		const tenants = await this.tenantRepo.list(command);
		return tenants.map(
			(tenant) =>
				new TenantResponseDto(
					tenant.id,
					tenant.name,
					tenant.subdomain.getRaw(),
					tenant.contatEmail.getValue(),
					tenant.isActive,
					tenant.createdAt,
				),
		);
	}
}
