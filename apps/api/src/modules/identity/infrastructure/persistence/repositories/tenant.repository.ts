import { EntityRepository } from '@mikro-orm/postgresql';
import { Tenant } from '../../../domain/entities/tenant.entity';
import {
	ITenantRepository,
	Pagination,
} from '../../../domain/repositories/tenant.repository.interface';
import { TenantOrmEntity } from '../entities/tenant.orm-entity';
import { TenantMapper } from '../mappers/tenant.mapper';

export class TenantRepository
	extends EntityRepository<TenantOrmEntity>
	implements ITenantRepository
{
	async findById(id: string): Promise<Tenant | null> {
		const orm = await this.findOne({ id });
		if (!orm) return null;
		return TenantMapper.toDomain(orm);
	}
	async findBySubdomain(subdomain: string): Promise<Tenant | null> {
		const orm = await this.findOne({ subdomain });
		if (!orm) return null;
		return TenantMapper.toDomain(orm);
	}
	async save(tenant: Tenant): Promise<void> {
		const orm = TenantMapper.toOrm(tenant);
		this.em.persist(orm);
		await this.em.flush();
	}
	async list(props: Pagination): Promise<Tenant[]> {
		const orm = await this.find(
			{},
			{
				limit: props.limit,
				offset: (props.page - 1) * props.limit,
			},
		);
		return orm.map((t) => TenantMapper.toDomain(t));
	}
}
