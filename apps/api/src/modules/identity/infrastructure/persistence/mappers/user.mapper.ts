import { User } from '../../../domain/entities/user.entity';
import { UserOrmEntity } from '../entities/user.orm-entity';

export class UserMapper {
	static toDomain(entity: UserOrmEntity): User {
		return User.reconstitute({
			id: entity.id,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			mustChangePassword: entity.mustChangePassword,
			email: entity.email,
			firstName: entity.email,
			lastName: entity.lastName,
			isActive: entity.isActive,
			passwordHash: entity.passwordHash,
		});
	}
	static toOrm(entity: User): UserOrmEntity {
		const orm = new UserOrmEntity();
		orm.email = entity.email;
		orm.createdAt = entity.createdAt;
		orm.firstName = entity.firstName;
		orm.id = entity.id;
		orm.isActive = entity.isActive;
		orm.lastName = entity.lastName;
		orm.mustChangePassword = entity.mustChangePassword;
		orm.passwordHash = entity.password.getRaw();
		orm.updatedAt = entity.updatedAt;
		return orm;
	}
}
