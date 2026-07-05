import { Inject, Injectable } from '@nestjs/common';
import { Roles } from '@repo/common';
import { IUserTenantMembershipRepository } from '../../../identity/domain/repositories/user-tenant-membership.repository.interface';
import { IMembershipPort } from '../../domain/ports/membership.port.interface';

@Injectable()
export class MembershipAdapter implements IMembershipPort {
	constructor(
		@Inject('IUserTenantMembershipRepository')
		private readonly membershipRepository: IUserTenantMembershipRepository,
	) {}
	async existsAndHasRole(
		userId: string,
		tenantId: string,
		role: Roles,
	): Promise<boolean> {
		const user = await this.membershipRepository.findByUserAndTenant(
			userId,
			tenantId,
		);
		if (!user) return false;
		return user.role === role;
	}
	async belongsToTenant(userId: string, tenantId: string): Promise<boolean> {
		const user = await this.membershipRepository.findByUserAndTenant(
			userId,
			tenantId,
		);
		return user != null;
	}
}
