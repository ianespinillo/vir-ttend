import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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
		const membership = await this.memberRepo.findByUserAndTenant(
			userId,
			command.tenantId,
		);
		if (!membership) throw new Error("User doesn't belongs to this tenant");
		if (!AuthorizationService.canManageRole(command.actorRole, membership.role))
			throw new Error('Unhautorized action');
		if (!membership.isActive)
			throw new Error("Can't deactivate a membership not active");
		membership.deactivate();
		await this.memberRepo.save(membership);
	}
}
