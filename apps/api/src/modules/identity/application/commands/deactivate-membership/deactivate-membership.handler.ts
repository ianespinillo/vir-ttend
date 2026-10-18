import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ROLES } from '@repo/common';
import {
	ConflictError,
	ForbiddenError,
	NotFoundError,
} from '../../../../../common/errors';
import { getTenancyConfig } from '../../../../shared/config/tenancy.config';
import { IUserTenantMembershipRepository } from '../../../domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { AuthorizationService } from '../../../domain/services/authorization.service';
import {
	SELF_DEACTIVATION_MESSAGE,
	assertNotLastActiveAdmin,
} from '../../services/admin-safeguard';
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
				throw new NotFoundError(
					`No existe un usuario con el correo ${command.email}.`,
				);
			userId = user.id;
		}
		const { TENANCY_MODE } = getTenancyConfig();
		if (command.actorRole === ROLES.ADMIN && userId === command.actorUserId)
			throw new ForbiddenException(SELF_DEACTIVATION_MESSAGE);
		let membership = command.tenantId
			? await this.memberRepo.findByUserAndTenant(userId, command.tenantId)
			: null;

		if (!membership && command.actorRole === ROLES.SUPERADMIN) {
			const list = await this.memberRepo.findByUserId(userId);
			membership = list[0] ?? null;
		}

		if (!membership)
			throw new NotFoundError('El usuario no pertenece a esta institución.');
		if (
			!AuthorizationService.canManageRole(
				command.actorRole,
				membership.role,
				TENANCY_MODE,
			)
		)
			throw new ForbiddenError('No tiene permiso para gestionar a este usuario.');
		if (!membership.isActive)
			throw new ConflictError(
				'El usuario ya está desactivado en esta institución.',
			);
		if (command.actorRole === ROLES.ADMIN)
			await assertNotLastActiveAdmin(this.memberRepo, membership);
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
