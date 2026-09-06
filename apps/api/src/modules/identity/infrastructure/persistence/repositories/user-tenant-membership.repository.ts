import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { UserTenantMembership } from '../../../domain/entities/user-tenant-membership.entity';
import {
	FindOptions,
	IUserTenantMembershipRepository,
} from '../../../domain/repositories/user-tenant-membership.repository.interface';
import { UserTenantMembershipOrmEntity } from '../entities/user-tenant-membership.orm-entity';
import { UserTenantMembershipMapper } from '../mappers/user-tenant-membership.mapper';

@Injectable()
export class UserTenantMembershipRepository
	implements IUserTenantMembershipRepository
{
	constructor(private readonly em: EntityManager) {}

	async findByTenant(
		tenantId: string,
		options: FindOptions,
	): Promise<{ total: number; items: UserTenantMembership[] }> {
		const [items, total] = await this.em.findAndCount(
			UserTenantMembershipOrmEntity,
			{ role: options.role, tenantId },
			{
				limit: options.limit,
				offset: (options.page - 1) * options.limit,
			},
		);
		return {
			total,
			items: items.map((uT) => UserTenantMembershipMapper.toDomain(uT)),
		};
	}
	async findByUserId(userId: string): Promise<UserTenantMembership[]> {
		const orm = await this.em.find(UserTenantMembershipOrmEntity, { userId });
		return orm.map((uT) => UserTenantMembershipMapper.toDomain(uT));
	}
	async findByUserAndTenant(
		userId: string,
		tenantId: string,
	): Promise<UserTenantMembership | null> {
		const orm = await this.em.findOne(UserTenantMembershipOrmEntity, { userId, tenantId });
		if (!orm) return null;
		return UserTenantMembershipMapper.toDomain(orm);
	}
	async save(uTMember: UserTenantMembership): Promise<void> {
		const orm = UserTenantMembershipMapper.toOrm(uTMember);
		this.em.persist(orm);
		await this.em.flush();
	}
}
