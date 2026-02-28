import { Tenant } from '../../../domain/entities/tenant.entity';
import { TenantOrmEntity } from '../entities/tenant.orm-entity';

export class TenantMapper {
	static toDomain(entity: TenantOrmEntity): Tenant {
		return Tenant.reconstitute(entity);
	}
	static toOrm(entity: Tenant): TenantOrmEntity {
		const orm = new TenantOrmEntity();
		orm.contactEmail = entity.contatEmail.getValue();
		orm.createdAt = entity.createdAt;
		orm.id = entity.id;
		orm.isActive = entity.isActive;
		orm.name = entity.name;
		orm.subdomain = entity.subdomain.getRaw();
		orm.updatedAt = entity.updatedAt;
		return orm;
	}
}
