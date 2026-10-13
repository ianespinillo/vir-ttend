import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ROLES } from '@repo/common';
import { getTenancyConfig } from '../../../../shared/config/tenancy.config';
import { IUserTenantMembershipRepository } from '../../../domain/repositories/user-tenant-membership.repository.interface';
import { AuthorizationService } from '../../../domain/services/authorization.service';
import {
	SELF_ROLE_CHANGE_MESSAGE,
	assertNotLastActiveAdmin,
} from '../../services/admin-safeguard';
import { ChangeMembershipRoleCommand } from './change-membership-role.command';

@Injectable()
export class ChangeMembershipRoleHandler {
	constructor(
		@Inject('IUserTenantMembershipRepository')
		private readonly memberRepo: IUserTenantMembershipRepository,
	) {}
	async execute(command: ChangeMembershipRoleCommand) {
		const { TENANCY_MODE } = getTenancyConfig();
		const isSingle = TENANCY_MODE === 'single';
		if (
			!AuthorizationService.canManageRole(
				command.actorRole,
				command.newRole,
				TENANCY_MODE,
			)
		)
			throw new Error('Unhautorized role managment');
		if (isSingle && command.userId === command.actorUserId)
			throw new ForbiddenException(SELF_ROLE_CHANGE_MESSAGE);
		let membership = command.tenantId
			? await this.memberRepo.findByUserAndTenant(command.userId, command.tenantId)
			: null;

		if (!membership && command.actorRole === ROLES.SUPERADMIN) {
			const list = await this.memberRepo.findByUserId(command.userId);
			membership = list[0] ?? null;
		}

		if (!membership) throw new Error("User doesn't belongs to this tenant");
		if (isSingle) {
			if (
				!AuthorizationService.canManageRole(
					command.actorRole,
					membership.role,
					TENANCY_MODE,
				)
			)
				throw new ForbiddenException('Unauthorized role managment');
			if (command.newRole !== ROLES.ADMIN)
				await assertNotLastActiveAdmin(this.memberRepo, membership);
		}
		membership.changeRole(command.newRole);
		await this.memberRepo.save(membership);
	}
}
