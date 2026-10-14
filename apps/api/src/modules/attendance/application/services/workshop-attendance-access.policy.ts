import { ForbiddenException } from '@nestjs/common';
import { ROLES, Roles } from '@repo/common';
import { WorkshopCommissionInfo } from '../../domain/ports/workshop-commission.port.interface';

export interface WorkshopActor {
	userId: string;
	role: Roles;
	tenantId: string;
}

/**
 * Who may record or read the workshop attendance of a commission: admins of the
 * tenant, and the preceptor the commission is assigned to. Fails closed on an
 * unknown tenant, and cross-tenant access is always forbidden.
 */
export function assertCanManageWorkshopAttendance(
	commission: WorkshopCommissionInfo,
	actor: WorkshopActor,
): void {
	if (
		!commission.tenantId ||
		!actor.tenantId ||
		commission.tenantId !== actor.tenantId
	) {
		throw new ForbiddenException('Commission does not belong to your tenant');
	}
	if (actor.role === ROLES.ADMIN) return;
	if (
		actor.role === ROLES.PRECEPTOR &&
		commission.preceptorId !== null &&
		commission.preceptorId === actor.userId
	)
		return;
	throw new ForbiddenException(
		'You are not allowed to manage attendance for this commission',
	);
}
