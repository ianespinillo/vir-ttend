import { Inject, Injectable } from '@nestjs/common';
import { ROLES } from '@repo/common';
import { ITenantRepository } from '../../../domain/repositories/tenant.repository.interface';
import { IUserTenantMembershipRepository } from '../../../domain/repositories/user-tenant-membership.repository.interface';
import { TenantResponseDto } from '../../dto/tenant.response.dto';
import { GetMyTenantsQuery } from './get-my-tenants.query';

@Injectable()
export class GetMyTenantsHandler {
	constructor(
		@Inject('IUserTenantMembershipRepository')
		private readonly memberRepo: IUserTenantMembershipRepository,
		@Inject('ITenantRepository')
		private readonly tenantRepo: ITenantRepository,
	) {}

	async execute(query: GetMyTenantsQuery): Promise<TenantResponseDto[]> {
		if (query.role === ROLES.SUPERADMIN) {
			const all = await this.tenantRepo.listAll();
			return all
				.filter((t) => t.isActive)
				.map(
					(t) =>
						new TenantResponseDto(
							t.id,
							t.name,
							t.subdomain.getRaw(),
							t.contatEmail.getValue(),
							t.isActive,
							t.createdAt,
						),
				);
		}

		const memberships = await this.memberRepo.findByUserId(query.userId);
		const activeMemberships = memberships.filter((m) => m.isActive);

		const result: TenantResponseDto[] = [];
		for (const m of activeMemberships) {
			const tenant = await this.tenantRepo.findById(m.tenantId);
			if (tenant?.isActive) {
				result.push(
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

		return result;
	}
}
