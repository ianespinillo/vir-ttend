import { IMembershipPort } from '../../application/ports/identity/membership.port.interface';

import { Injectable } from '@nestjs/common';
import { Roles } from '@repo/common';
import { IUserTenantMembershipRepository } from '../../../identity/domain/repositories/user-tenant-membership.repository.interface';

@Injectable()
export class MembershipAdapter implements IMembershipPort {
	constructor(private readonly memberRepo: IUserTenantMembershipRepository) {}
	async existsAndHasRole(
		userId: string,
		tenantId: string,
		role: Roles,
	): Promise<boolean> {
		const user = await this.memberRepo.findByUserAndTenant(userId, tenantId);
		if (!user) return false;
		return user?.role === role;
	}
	async belongsToTenant(userId: string, tenantId: string): Promise<boolean> {
		const user = await this.memberRepo.findByUserAndTenant(userId, tenantId);
		return !!user;
	}
}
