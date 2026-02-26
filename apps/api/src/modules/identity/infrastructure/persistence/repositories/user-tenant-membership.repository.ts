import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { UserTenantMembership } from '../../../domain/entities/user-tenant-membership.entity';
import { IUserTenantMembershipRepository } from '../../../domain/repositories/user-tenant-membership.repository.interface';
import { UserTenantMembershipOrmEntity } from '../entities/user-tenant-membership.orm-entity';
import { UserTenantMembershipMapper } from '../mappers/user-tenant-membership.mapper';

@Injectable()
export class UserTenantMembershipRepository
	extends EntityRepository<UserTenantMembershipOrmEntity>
	implements IUserTenantMembershipRepository
{
	async findByUserId(userId: string): Promise<UserTenantMembership[]> {
		const orm = await this.find({ userId });
		return orm.map((uT) => UserTenantMembershipMapper.toDomain(uT));
	}
	async findByUserAndTenant(
		userId: string,
		tenantId: string,
	): Promise<UserTenantMembership | null> {
		const orm = await this.findOne({ userId, tenantId });
		if (!orm) return null;
		return UserTenantMembershipMapper.toDomain(orm);
	}
	async save(uTMember: UserTenantMembership): Promise<void> {
		const orm = UserTenantMembershipMapper.toOrm(uTMember);
		this.em.persist(orm);
		await this.em.flush();
	}
}
