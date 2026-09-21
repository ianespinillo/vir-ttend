import { EntityRepository, type FilterQuery } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class UserRepository
	extends EntityRepository<UserOrmEntity>
	implements IUserRepository
{
	async findByEmail(email: string): Promise<User | null> {
		const orm = await this.findOne({ email });
		if (!orm) return null;
		return UserMapper.toDomain(orm);
	}
	async findById(id: string): Promise<User | null> {
		const orm = await this.findOne({ id });
		if (!orm) return null;
		return UserMapper.toDomain(orm);
	}
	async save(user: User): Promise<void> {
		const orm = UserMapper.toOrm(user);
		this.em.persist(orm);
		await this.em.flush();
	}
	async exists(email: string): Promise<boolean> {
		const orm = await this.findOne({ email });
		return !!orm;
	}
	async list(options: {
		page: number;
		limit: number;
		search?: string;
	}): Promise<{ total: number; items: User[] }> {
		const where: FilterQuery<UserOrmEntity> = {};
		if (options.search?.trim()) {
			const term = `%${options.search.trim()}%`;
			where.$or = [
				{ firstName: { $ilike: term } },
				{ lastName: { $ilike: term } },
				{ email: { $ilike: term } },
			];
		}
		const [items, total] = await this.findAndCount(where, {
			limit: options.limit,
			offset: (options.page - 1) * options.limit,
			orderBy: { createdAt: 'DESC' },
		});
		return {
			total,
			items: items.map((u) => UserMapper.toDomain(u)),
		};
	}
}
