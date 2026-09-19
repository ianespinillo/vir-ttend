import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Inject,
	Injectable,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { type CreateUserResponse, ROLES, Roles } from '@repo/common';
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
	[ROLES.SUPERADMIN]: [
		ROLES.SUPERADMIN,
		ROLES.ADMIN,
		ROLES.PRECEPTOR,
		ROLES.TEACHER,
	],
	[ROLES.ADMIN]: [ROLES.PRECEPTOR, ROLES.TEACHER],
	[ROLES.PRECEPTOR]: [],
	[ROLES.TEACHER]: [],
};

@Injectable()
export class CreateUserHandler {
	constructor(
		@Inject('IUserRepository')
		private readonly userRepository: IUserRepository,
		@Inject('IUserTenantMembershipRepository')
		private readonly memberRepo: IUserTenantMembershipRepository,
		private readonly passwordService: PasswordService,
		private readonly eventEmitter: EventEmitter2,
	) {}

	async execute(command: CreateUserCommand): Promise<CreateUserResponse> {
		// 1. validar jerarquía de roles
		if (!canCreate[command.createdByRole]?.includes(command.role)) {
			throw new ForbiddenException('Insufficient permissions to create this role');
		}

		// 2. si el rol no es SUPERADMIN, el tenant es obligatorio
		if (command.role !== ROLES.SUPERADMIN && !command.tenantId) {
			throw new BadRequestException('El tenant es obligatorio para este rol');
		}

		// 3. verificar si el email ya existe
		let user = await this.userRepository.findByEmail(command.email);
		let temporaryPassword: string | undefined;

		if (!user) {
			const rawPassword = Password.generateRandomPassword(8);
			temporaryPassword = rawPassword.getRaw();
			const hashed = await this.passwordService.hashPassword(rawPassword);
			user = User.create({
				email: command.email,
				firstName: command.firstName,
				lastName: command.lastName,
				password: hashed,
			});
			await this.userRepository.save(user);

			if (command.role !== ROLES.SUPERADMIN && command.tenantId) {
				await this.memberRepo.save(
					UserTenantMembership.create(user.id, command.tenantId, command.role),
				);
			}

			this.eventEmitter.emit(
				'user.created',
				new UserCreatedEvent(
					user.id,
					user.email,
					command.tenantId ?? '',
					rawPassword.getRaw(),
				),
			);
		} else {
			// El usuario ya existe, vincular a nuevo tenant si aplica
			if (command.role !== ROLES.SUPERADMIN && command.tenantId) {
				const exists = await this.memberRepo.findByUserAndTenant(
					user.id,
					command.tenantId,
				);
				if (exists) throw new ConflictException('User already belongs to tenant');
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

		return {
			id: user.id,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			role: command.role,
			tenantId: command.tenantId,
			temporaryPassword,
		};
	}
}
