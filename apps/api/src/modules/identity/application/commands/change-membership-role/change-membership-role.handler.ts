import { Injectable } from '@nestjs/common';
import { IUserTenantMembershipRepository } from '../../../domain/repositories/user-tenant-membership.repository.interface';
import { AuthorizationService } from '../../../domain/services/authorization.service';
import { ChangeMembershipRoleCommand } from './change-membership-role.command';

@Injectable()
export class ChangeMembershipRoleHandler {
	constructor(private readonly memberRepo: IUserTenantMembershipRepository) {}
	async execute(command: ChangeMembershipRoleCommand) {
		if (!AuthorizationService.canManageRole(command.actorRole, command.newRole))
			throw new Error('Unhautorized role managment');
		const membership = await this.memberRepo.findByUserAndTenant(
			command.userId,
			command.tenantId,
		);
		if (!membership) throw new Error("User doesn't belongs to this tenant");
		membership.changeRole(command.newRole);
		await this.memberRepo.save(membership);
	}
}
