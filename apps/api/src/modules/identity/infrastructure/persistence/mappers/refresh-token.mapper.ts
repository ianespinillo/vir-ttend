import { RefreshToken } from '../../../domain/entities/refresh-token.entity';
import { RefreshTokenOrmEntity } from '../entities/refresh-token.orm-entity';

export class RefreshTokenMapper {
	static toDomain(entity: RefreshTokenOrmEntity): RefreshToken {
		return RefreshToken.reconstitute({
			...entity,
			id: entity.id,
			createdAt: entity.createdAt,
		});
	}
	static toOrm(entity: RefreshToken): RefreshTokenOrmEntity {
		const orm = new RefreshTokenOrmEntity();
		orm.createdAt = entity.createdAt;
		orm.expiresAt = entity.expiresAt;
		orm.id = entity.id;
		orm.revokedAt = entity.revokedAt;
		orm.tenantId = entity.tenantId;
		orm.token = entity.token;
		orm.userId = entity.userId;
		return orm;
	}
}
