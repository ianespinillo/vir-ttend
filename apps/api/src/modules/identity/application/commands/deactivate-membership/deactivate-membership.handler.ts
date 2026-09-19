import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ROLES } from '@repo/common';
import { IUserTenantMembershipRepository } from '../../../domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { AuthorizationService } from '../../../domain/services/authorization.service';
import { DeactivateMembershipCommand } from './deactivate-membership.command';
@Injectable()
export class DeactivateMembershipHandler {
	constructor(
		@Inject('IUserRepository')
		private readonly userRepository: IUserRepository,
		@Inject('IUserTenantMembershipRepository')
		private readonly memberRepo: IUserTenantMembershipRepository,
	) {}
	async execute(command: DeactivateMembershipCommand) {
		let userId = command.userId;
		if (command.email) {
			const user = await this.userRepository.findByEmail(command.email);
			if (!user)
				throw new NotFoundException(`User with email ${command.email} not found`);
			userId = user.id;
		}
		let membership = command.tenantId
			? await this.memberRepo.findByUserAndTenant(userId, command.tenantId)
			: null;

		if (!membership && command.actorRole === ROLES.SUPERADMIN) {
			const list = await this.memberRepo.findByUserId(userId);
			membership = list[0] ?? null;
		}

		if (!membership) throw new Error("User doesn't belongs to this tenant");
		if (!AuthorizationService.canManageRole(command.actorRole, membership.role))
			throw new Error('Unhautorized action');
		if (!membership.isActive)
			throw new Error("Can't deactivate a membership not active");
		membership.deactivate();
		await this.memberRepo.save(membership);

		// Desactivar el usuario global si no tiene otras membresías activas
		const user = await this.userRepository.findById(userId);
		if (user) {
			const all = await this.memberRepo.findByUserId(userId);
			if (!all.some((m) => m.isActive)) {
				user.deactivate();
				await this.userRepository.save(user);
			}
		}
	}
}
