import { Injectable } from '@nestjs/common';
import { Tenant as IdentityTenant } from '../../../identity/domain/entities/tenant.entity';
import { TenantRepository } from '../../../identity/infrastructure/persistence/repositories/tenant.repository';
import { Tenant } from '../../domain/entities/tenant.entity';
import { ITenantPort } from '../../domain/ports/tenant.port.interface';

@Injectable()
export class TenantAdapter implements ITenantPort {
	constructor(private readonly tenantRepo: TenantRepository) {}
	async findById(id: string): Promise<Tenant | null> {
		const tenant = await this.tenantRepo.findById(id);
		return tenant ? this.toDomain(tenant) : null;
	}
	private toDomain(tenant: IdentityTenant): Tenant {
		return Tenant.reconstitute({ id: tenant.id, name: tenant.name });
	}
}
