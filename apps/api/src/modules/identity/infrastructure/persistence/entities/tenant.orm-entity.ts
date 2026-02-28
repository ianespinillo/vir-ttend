import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '../../../../shared/database/entities/base.entity';
import { TenantRepository } from '../repositories/tenant.repository';

@Entity({ tableName: 'tenants', repository: () => TenantRepository })
export class TenantOrmEntity extends BaseEntity {
	@Property() name!: string;
	@Property({ unique: true }) subdomain!: string;
	@Property() contactEmail!: string;
	@Property() isActive!: boolean;
}
