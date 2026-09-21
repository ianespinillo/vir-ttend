import {
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { ROLES } from '@repo/common';
import { IUserTenantMembershipRepository } from '../../../domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { AuthorizationService } from '../../../domain/services/authorization.service';
import { PasswordService } from '../../../domain/services/password.service';
import { Password } from '../../../domain/value-objects/password.vo';
import { ResetUserPasswordCommand } from './reset-user-password.command';

export interface ResetUserPasswordResult {
	userId: string;
	email: string;
	firstName: string;
	lastName: string;
	temporaryPassword: string;
}

@Injectable()
export class ResetUserPasswordHandler {
	constructor(
		@Inject('IUserRepository')
		private readonly userRepository: IUserRepository,
		@Inject('IUserTenantMembershipRepository')
		private readonly memberRepo: IUserTenantMembershipRepository,
		private readonly passwordService: PasswordService,
	) {}

	async execute(
		command: ResetUserPasswordCommand,
	): Promise<ResetUserPasswordResult> {
		const user = await this.userRepository.findById(command.userId);
		if (!user) {
			throw new NotFoundException(`User with id ${command.userId} not found`);
		}

		let membership = command.tenantId
			? await this.memberRepo.findByUserAndTenant(command.userId, command.tenantId)
			: null;

		if (!membership && command.actorRole === ROLES.SUPERADMIN) {
			const list = await this.memberRepo.findByUserId(command.userId);
			membership = list[0] ?? null;
		}

		if (membership) {
			if (
				!AuthorizationService.canManageRole(command.actorRole, membership.role)
			) {
				throw new ForbiddenException('Unauthorized action');
			}
		} else if (command.actorRole !== ROLES.SUPERADMIN) {
			throw new ForbiddenException('User does not belong to your institution');
		}

		const rawPassword = Password.generateRandomPassword(8);
		const hash = await this.passwordService.hashPassword(rawPassword);

		user.resetTemporaryPassword(hash);
		await this.userRepository.save(user);

		return {
			userId: user.id,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			temporaryPassword: rawPassword.getRaw(),
		};
	}
}
