import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '../../../../shared/database/entities/base.entity';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';

// refresh-token.orm-entity.ts
@Entity({
	tableName: 'refresh_tokens',
	repository: () => RefreshTokenRepository,
})
export class RefreshTokenOrmEntity extends BaseEntity {
	@Property() userId!: string;
	@Property() tenantId!: string;
	@Property() token!: string;
	@Property() expiresAt!: Date;
	@Property({ nullable: true }) revokedAt?: Date;
}
