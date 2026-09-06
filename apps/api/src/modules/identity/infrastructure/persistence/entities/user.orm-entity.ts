import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '../../../../shared/database/entities/base.entity';
import { UserRepository } from '../repositories/user.repository';

// user.orm-entity.ts
@Entity({ tableName: 'users', repository: () => UserRepository })
export class UserOrmEntity extends BaseEntity {
	@Property() email!: string;
	@Property({ name: 'password_hash' }) passwordHash!: string;
	@Property({ name: 'first_name' }) firstName!: string;
	@Property({ name: 'last_name' }) lastName!: string;
	@Property({ name: 'is_active' }) isActive!: boolean;
	@Property({ name: 'must_change_password' }) mustChangePassword!: boolean;
}
