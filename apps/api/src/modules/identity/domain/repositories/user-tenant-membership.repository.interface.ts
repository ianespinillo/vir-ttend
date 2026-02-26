import { UserTenantMembership } from '../entities/user-tenant-membership.entity';
import { User } from '../entities/user.entity';

export interface IUserTenantMembershipRepository {
	findByUserId(userId: string): Promise<UserTenantMembership[]>;
	findByUserAndTenant(
		userId: string,
		tenantId: string,
	): Promise<UserTenantMembership | null>;
	save(uTMember: UserTenantMembership): Promise<void>;
}
