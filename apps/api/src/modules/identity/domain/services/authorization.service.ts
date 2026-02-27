import { ROLES, Roles } from '@repo/common';

const canManage: Record<Roles, Roles[]> = {
	[ROLES.SUPERADMIN]: [ROLES.ADMIN],
	[ROLES.ADMIN]: [ROLES.PRECEPTOR, ROLES.TEACHER],
	[ROLES.PRECEPTOR]: [],
	[ROLES.TEACHER]: [],
};
export class AuthorizationService {
	static canManageRole(actorRole: Roles, targetRole: Roles): boolean {
		return canManage[actorRole].includes(targetRole);
	}
	static canAccessTenant(
		jwtTenantId: string | null,
		resourceTenantId: string,
	): boolean {
		if (!jwtTenantId) return true;
		return jwtTenantId === resourceTenantId;
	}
}
