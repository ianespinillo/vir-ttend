import { ROLES, Roles } from '@repo/common';

export type AuthorizationTenancyMode = 'multi' | 'single';

const canManage: Record<Roles, Roles[]> = {
	[ROLES.SUPERADMIN]: [ROLES.ADMIN],
	[ROLES.ADMIN]: [ROLES.ADMIN, ROLES.PRECEPTOR, ROLES.TEACHER],
	[ROLES.PRECEPTOR]: [],
	[ROLES.TEACHER]: [],
};

const canCreate: Record<Roles, Roles[]> = {
	[ROLES.SUPERADMIN]: [
		ROLES.SUPERADMIN,
		ROLES.ADMIN,
		ROLES.PRECEPTOR,
		ROLES.TEACHER,
	],
	[ROLES.ADMIN]: [ROLES.ADMIN, ROLES.PRECEPTOR, ROLES.TEACHER],
	[ROLES.PRECEPTOR]: [],
	[ROLES.TEACHER]: [],
};

const ADMIN_MANAGED_ROLES: Roles[] = [
	ROLES.ADMIN,
	ROLES.PRECEPTOR,
	ROLES.TEACHER,
];

export class AuthorizationService {
	static canManageRole(
		actorRole: Roles,
		targetRole: Roles,
		_mode: AuthorizationTenancyMode = 'multi',
	): boolean {
		if (actorRole === ROLES.ADMIN) {
			return ADMIN_MANAGED_ROLES.includes(targetRole);
		}
		return canManage[actorRole]?.includes(targetRole) ?? false;
	}
	static canCreateRole(
		actorRole: Roles,
		role: Roles,
		_mode: AuthorizationTenancyMode = 'multi',
	): boolean {
		if (actorRole === ROLES.ADMIN) {
			return ADMIN_MANAGED_ROLES.includes(role);
		}
		return canCreate[actorRole]?.includes(role) ?? false;
	}
	static canAccessTenant(
		jwtTenantId: string | null,
		resourceTenantId: string,
	): boolean {
		if (!jwtTenantId) return true;
		return jwtTenantId === resourceTenantId;
	}
}
