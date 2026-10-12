import type { PublicConfig } from './public-config';

export type TenantSelection =
	| { kind: 'direct'; tenantId: string }
	| { kind: 'choose' }
	| { kind: 'denied'; message: string };

/**
 * Decides which school a freshly authenticated user works in. Pure.
 *
 * - Server says `single` with a school: that school, or denied when the user
 *   has no allowed role there.
 * - Otherwise (multi, or no server config at all): membership based. One
 *   allowed school is selected directly, several are offered to the user.
 */
export const decideTenantSelection = (
	server: PublicConfig | null,
	allowedTenantIds: readonly string[],
): TenantSelection => {
	if (server?.tenancyMode === 'single' && server.tenantId) {
		if (allowedTenantIds.includes(server.tenantId)) {
			return { kind: 'direct', tenantId: server.tenantId };
		}
		const where = server.tenantName ?? 'esta institución';
		return {
			kind: 'denied',
			message: `Acceso restringido: No tenés asignado un rol de preceptor o docente en ${where}.`,
		};
	}

	if (allowedTenantIds.length === 1) {
		return { kind: 'direct', tenantId: allowedTenantIds[0] };
	}
	return { kind: 'choose' };
};
