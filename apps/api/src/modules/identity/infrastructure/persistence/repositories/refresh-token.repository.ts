import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { RefreshToken } from '../../../domain/entities/refresh-token.entity';
import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface';
import { RefreshTokenOrmEntity } from '../entities/refresh-token.orm-entity';
import { RefreshTokenMapper } from '../mappers/refresh-token.mapper';

@Injectable()
export class RefreshTokenRepository
	extends EntityRepository<RefreshTokenOrmEntity>
	implements IRefreshTokenRepository
{
	async save(token: RefreshToken): Promise<void> {
		const orm = RefreshTokenMapper.toOrm(token);
		this.em.persist(orm);
		await this.em.flush();
	}
	async findByHash(token: string): Promise<RefreshToken | null> {
		const orm = await this.findOne({ token });
		if (!orm) return null;
		return RefreshTokenMapper.toDomain(orm);
	}
	async revokeAllByUserId(userId: string): Promise<void> {
		const tokens = await this.find({ userId });
		for (const token of tokens) {
			token.revokedAt = new Date();
			this.em.persist(token);
		}
		await this.em.flush();
	}
}
