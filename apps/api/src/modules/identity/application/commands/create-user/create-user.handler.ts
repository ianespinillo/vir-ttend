import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ROLES, Roles } from '@repo/common';
import { UserTenantMembership } from '../../../domain/entities/user-tenant-membership.entity';
import { User } from '../../../domain/entities/user.entity';
import { UserCreatedEvent } from '../../../domain/events/user-created.event';
import { UserTenantLinkedEvent } from '../../../domain/events/user-tenant-linked.event';
import { IUserTenantMembershipRepository } from '../../../domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { PasswordService } from '../../../domain/services/password.service';
import { Password } from '../../../domain/value-objects/password.vo';
import { CreateUserCommand } from './create-user.command';

const canCreate: Record<Roles, Roles[]> = {
	[ROLES.SUPERADMIN]: [ROLES.ADMIN],
	[ROLES.ADMIN]: [ROLES.PRECEPTOR, ROLES.TEACHER],
	[ROLES.PRECEPTOR]: [],
	[ROLES.TEACHER]: [],
};

@Injectable()
export class CreateUserHandler {
	constructor(
		private readonly userRepository: IUserRepository,
		private readonly memberRepo: IUserTenantMembershipRepository,
		private readonly passwordService: PasswordService,
		private readonly eventEmitter: EventEmitter2,
	) {}

	async execute(command: CreateUserCommand): Promise<void> {
		// 1. validar jerarquía de roles

		if (!canCreate[command.createdByRole]?.includes(command.role)) {
			throw new Error('Insufficient permissions to create this role');
		}

		// 2. verificar que el email no exista
		let user = await this.userRepository.findByEmail(command.email);
		if (!user) {
			const rawPasword = Password.generateRandomPassword(8);
			const hashed = await this.passwordService.hashPassword(rawPasword);
			user = User.create({
				email: command.email,
				firstName: command.firstName,
				lastName: command.lastName,
				password: hashed,
			});
			await this.userRepository.save(user);
			await this.memberRepo.save(
				UserTenantMembership.create(user.id, command.tenantId, command.role),
			);
			this.eventEmitter.emit(
				'user.created',
				new UserCreatedEvent(
					user.id,
					user.email,
					command.tenantId,
					rawPasword.getRaw(),
				),
			);
			return;
		}
		if (command.tenantId) {
			const exists = await this.memberRepo.findByUserAndTenant(
				user.id,
				command.tenantId,
			);
			if (exists) throw new Error('User already belongs to tenant');
			const membership = UserTenantMembership.create(
				user.id,
				command.tenantId,
				command.role,
			);
			await this.memberRepo.save(membership);
			this.eventEmitter.emit(
				'user.tenant.linked',
				new UserTenantLinkedEvent(
					user.id,
					user.email,
					command.tenantId,
					command.role,
				),
			);
		}
	}
}
