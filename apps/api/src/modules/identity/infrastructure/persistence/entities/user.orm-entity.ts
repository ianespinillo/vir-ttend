import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '../../../../shared/database/entities/base.entity';
import { UserRepository } from '../repositories/user.repository';

// user.orm-entity.ts
@Entity({ tableName: 'users', repository: () => UserRepository })
export class UserOrmEntity extends BaseEntity {
	@Property() email!: string;
	@Property() passwordHash!: string;
	@Property() firstName!: string;
	@Property() lastName!: string;
	@Property() isActive!: boolean;
	@Property() mustChangePassword!: boolean;
}
