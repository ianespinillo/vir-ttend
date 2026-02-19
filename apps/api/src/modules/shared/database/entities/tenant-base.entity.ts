import { Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';

export abstract class TenantBaseEntity extends BaseEntity {
	@Property({ type: 'uuid' })
	private readonly _tenant_id!: string;

	get tenantId(): string {
		return this._tenant_id;
	}
}
