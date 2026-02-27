import { Injectable } from '@nestjs/common';
import { ITenantRepository } from '../../../domain/repositories/tenant.repository.interface';
import { TenantResponseDto } from '../../dto/tenant.response.dto';
import { GetTenantQuery } from './get-tenant.query';

@Injectable()
export class GetTenantHandler {
	constructor(private readonly tenantRepo: ITenantRepository) {}
	async execute(command: GetTenantQuery): Promise<TenantResponseDto> {
		const tenant = await this.tenantRepo.findById(command.tenantId);
		if (!tenant) throw new Error('Tenant not found');
		return new TenantResponseDto(
			tenant.id,
			tenant.name,
			tenant.subdomain.getRaw(),
			tenant.contatEmail.getValue(),
			tenant.isActive,
			tenant.createdAt,
		);
	}
}
