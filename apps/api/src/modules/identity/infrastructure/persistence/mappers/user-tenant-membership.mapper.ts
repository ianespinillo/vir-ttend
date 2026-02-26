import { UserTenantMembership } from '../../../domain/entities/user-tenant-membership.entity';
import { UserTenantMembershipOrmEntity } from '../entities/user-tenant-membership.orm-entity';
export class UserTenantMembershipMapper {
	static toDomain(entity: UserTenantMembershipOrmEntity): UserTenantMembership {
		return UserTenantMembership.reconstitute({
			...entity,
			id: entity.id,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		});
	}
	static toOrm({
		createdAt,
		id,
		isActive,
		role,
		tenantId,
		updatedAt,
		userId,
	}: UserTenantMembership): UserTenantMembershipOrmEntity {
		const orm = new UserTenantMembershipOrmEntity();
		orm.createdAt = createdAt;
		orm.id = id;
		orm.isActive = isActive;
		orm.role = role;
		orm.tenantId = tenantId;
		orm.updatedAt = updatedAt;
		orm.userId = userId;
		return orm;
	}
}
