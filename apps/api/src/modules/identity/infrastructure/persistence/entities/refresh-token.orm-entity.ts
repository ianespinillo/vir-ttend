import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '../../../../shared/database/entities/base.entity';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';

// refresh-token.orm-entity.ts
@Entity({
	tableName: 'refresh_tokens',
	repository: () => RefreshTokenRepository,
})
export class RefreshTokenOrmEntity extends BaseEntity {
	@Property({ name: 'user_id', type: 'uuid' }) userId!: string;
	@Property({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
	@Property() token!: string;
	@Property({ name: 'expires_at' }) expiresAt!: Date;
	@Property({ name: 'revoked_at', nullable: true }) revokedAt?: Date;
}
