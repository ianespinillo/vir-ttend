import { Entity, Property } from '@mikro-orm/core';
import { Roles } from '@repo/common';
import { BaseEntity } from '../../../../shared/database/entities/base.entity';
import { UserTenantMembershipRepository } from '../repositories/user-tenant-membership.repository';

// user-tenant-membership.orm-entity.ts
@Entity({
	tableName: 'user_tenant_memberships',
	repository: () => UserTenantMembershipRepository,
})
export class UserTenantMembershipOrmEntity extends BaseEntity {
	@Property({ name: 'user_id', type: 'uuid' }) userId!: string;
	@Property({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
	@Property({ type: 'string' }) role!: Roles;
	@Property({ name: 'is_active' }) isActive!: boolean;
}
