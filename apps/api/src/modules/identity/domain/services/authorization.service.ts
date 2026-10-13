import { ROLES, Roles } from '@repo/common';

export type AuthorizationTenancyMode = 'multi' | 'single';

const canManage: Record<Roles, Roles[]> = {
	[ROLES.SUPERADMIN]: [ROLES.ADMIN],
	[ROLES.ADMIN]: [ROLES.PRECEPTOR, ROLES.TEACHER],
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
	[ROLES.ADMIN]: [ROLES.PRECEPTOR, ROLES.TEACHER],
	[ROLES.PRECEPTOR]: [],
	[ROLES.TEACHER]: [],
};

// En modo single-tenant el ADMIN administra a otros ADMIN del colegio.
const SINGLE_TENANT_ADMIN_ROLES: Roles[] = [
	ROLES.ADMIN,
	ROLES.PRECEPTOR,
	ROLES.TEACHER,
];

export class AuthorizationService {
	static canManageRole(
		actorRole: Roles,
		targetRole: Roles,
		mode: AuthorizationTenancyMode = 'multi',
	): boolean {
		if (mode === 'single' && actorRole === ROLES.ADMIN) {
			return SINGLE_TENANT_ADMIN_ROLES.includes(targetRole);
		}
		return canManage[actorRole].includes(targetRole);
	}
	static canCreateRole(
		actorRole: Roles,
		role: Roles,
		mode: AuthorizationTenancyMode = 'multi',
	): boolean {
		if (mode === 'single' && actorRole === ROLES.ADMIN) {
			return SINGLE_TENANT_ADMIN_ROLES.includes(role);
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
