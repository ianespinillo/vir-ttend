import { Roles } from '@repo/common';
import { UserTenantMembership } from '../entities/user-tenant-membership.entity';

export interface FindOptions {
	page: number;
	limit: number;
	role?: Roles;
}

export interface TenantUsersCount {
	tenantId: string;
	count: number;
}
export interface IUserTenantMembershipRepository {
	findByUserId(userId: string): Promise<UserTenantMembership[]>;
	findByTenant(
		tenantId: string,
		options: FindOptions,
	): Promise<{ total: number; items: UserTenantMembership[] }>;
	findByUserAndTenant(
		userId: string,
		tenantId: string,
	): Promise<UserTenantMembership | null>;
	countActiveByTenant(): Promise<TenantUsersCount[]>;
	save(uTMember: UserTenantMembership): Promise<void>;
}
