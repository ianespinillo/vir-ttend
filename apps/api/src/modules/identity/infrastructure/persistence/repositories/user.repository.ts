import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class UserRepository implements IUserRepository {
	constructor(private readonly em: EntityManager) {}

	async findByEmail(email: string): Promise<User | null> {
		const orm = await this.em.findOne(UserOrmEntity, { email });
		if (!orm) return null;
		return UserMapper.toDomain(orm);
	}
	async findById(id: string): Promise<User | null> {
		const orm = await this.em.findOne(UserOrmEntity, { id });
		if (!orm) return null;
		return UserMapper.toDomain(orm);
	}
	async save(user: User): Promise<void> {
		const orm = UserMapper.toOrm(user);
		this.em.persist(orm);
		await this.em.flush();
	}
	async exists(email: string): Promise<boolean> {
		const orm = await this.em.findOne(UserOrmEntity, { email });
		return !!orm;
	}
}
