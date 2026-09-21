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
import { ToggleUserStatusCommand } from './toggle-user-status.command';

@Injectable()
export class ToggleUserStatusHandler {
	constructor(
		@Inject('IUserRepository')
		private readonly userRepository: IUserRepository,
		@Inject('IUserTenantMembershipRepository')
		private readonly memberRepo: IUserTenantMembershipRepository,
	) {}

	async execute(command: ToggleUserStatusCommand): Promise<void> {
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

			if (command.isActive) {
				membership.activate();
			} else {
				membership.deactivate();
			}
			await this.memberRepo.save(membership);
		}

		if (command.isActive) {
			user.activate();
		} else {
			const allMemberships = await this.memberRepo.findByUserId(command.userId);
			const hasActive = allMemberships.some((m) => m.isActive);
			if (!hasActive) {
				user.deactivate();
			}
		}

		await this.userRepository.save(user);
	}
}
