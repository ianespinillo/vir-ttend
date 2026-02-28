import { Injectable } from '@nestjs/common';
import { IUserTenantMembershipRepository } from '../../../domain/repositories/user-tenant-membership.repository.interface';
import { AuthorizationService } from '../../../domain/services/authorization.service';
import { DeactivateMembershipCommand } from './deactivate-membership.command';
@Injectable()
export class DeactivateMembershipHandler {
	constructor(private readonly memberRepo: IUserTenantMembershipRepository) {}
	async execute(command: DeactivateMembershipCommand) {
		const membership = await this.memberRepo.findByUserAndTenant(
			command.userId,
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
