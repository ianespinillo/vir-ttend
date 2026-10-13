import { ForbiddenException } from '@nestjs/common';
import { ROLES } from '@repo/common';
import { UserTenantMembership } from '../../domain/entities/user-tenant-membership.entity';
import { IUserTenantMembershipRepository } from '../../domain/repositories/user-tenant-membership.repository.interface';

export const SELF_ROLE_CHANGE_MESSAGE = 'No puedes cambiar tu propio rol';
export const SELF_DEACTIVATION_MESSAGE = 'No puedes desactivarte a ti mismo';
export const LAST_ADMIN_MESSAGE =
	'No se puede quitar al último administrador activo del colegio';

/**
 * Impide dejar al tenant sin ADMIN activo: se rechaza si la membresía objetivo
 * es el único ADMIN activo del tenant.
 */
export async function assertNotLastActiveAdmin(
	memberRepo: IUserTenantMembershipRepository,
	membership: UserTenantMembership,
): Promise<void> {
	if (membership.role !== ROLES.ADMIN || !membership.isActive) return;
	const activeAdmins = await memberRepo.countActiveByTenantAndRole(
		membership.tenantId,
		ROLES.ADMIN,
	);
	if (activeAdmins <= 1) throw new ForbiddenException(LAST_ADMIN_MESSAGE);
}
