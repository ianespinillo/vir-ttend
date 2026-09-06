import { EntityRepository } from '@mikro-orm/postgresql';
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
}
