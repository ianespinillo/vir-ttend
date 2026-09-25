/**
 * Demo session helpers — pure, framework-free logic shared by the landing
 * page, the authenticated shell and the role switcher.
 *
 * Everything here is a function/data of the seeded demo (no DOM, no React):
 * the vitest suite covers it without jsdom.
 */

import { ALL_NAV_ITEMS, type Roles, isPathAllowedForRole } from '@repo/common';
import { demoIds } from '../store/seed-data.js';
import { getLandingProfiles } from '../store/selectors.js';
import type { DemoState } from '../store/types.js';

/** Spanish role labels shown across the demo UI (same wording as the product). */
export const ROLE_LABELS: Record<Roles, string> = {
	superadmin: 'Super Admin',
	admin: 'Administrador',
	preceptor: 'Preceptor',
	teacher: 'Docente',
};

/** Badge variant per role, mirroring the product user menu. */
export const ROLE_BADGE_VARIANTS: Record<
	Roles,
	'default' | 'secondary' | 'outline' | 'destructive'
> = {
	superadmin: 'destructive',
	admin: 'default',
	preceptor: 'secondary',
	teacher: 'outline',
};

/** The fixed ids of the six canonical demo profiles (seed slugs). */
export const DEMO_PROFILE_IDS: ReadonlySet<string> = new Set(
	Object.values(demoIds.user),
);

/** Short descriptor per demo profile (landing cards and role switcher rows). */
export const PROFILE_DESCRIPTORS: Record<string, string> = {
	[demoIds.user['carlos-ramos']]: 'Plataforma completa',
	[demoIds.user['ana-gomez']]: 'Gestión integral del colegio',
	[demoIds.user['roberto-lopez']]: 'Primaria · 1º Grado A',
	[demoIds.user['laura-martinez']]: 'Secundaria · 3º Año A',
	[demoIds.user['javier-perez']]: 'Matemática · 3º Año A',
	[demoIds.user['elena-fernandez']]: 'Historia · 3º Año A',
};

export type DemoProfile = ReturnType<typeof getLandingProfiles>[number];

/**
 * Paths of the product navigation that `role` is allowed to open, computed
 * with the exact same guard the client shell uses (isPathAllowedForRole).
 */
export function allowedPathsForRole(role: Roles): string[] {
	return ALL_NAV_ITEMS.filter((item) =>
		isPathAllowedForRole(item.href, role),
	).map((item) => item.href);
}

/**
 * The six canonical demo profiles, in seed order. Users created during a
 * session are excluded so the landing and the role switcher stay stable.
 */
export function getDemoProfiles(state: DemoState): DemoProfile[] {
	return getLandingProfiles(state).filter((profile) =>
		DEMO_PROFILE_IDS.has(profile.user.id),
	);
}

/** Product-style avatar initials, e.g. ("Ana", "Gómez") -> "AG". */
export function getInitials(firstName?: string, lastName?: string): string {
	const first = (firstName ?? '').trim().charAt(0) ?? '';
	const last = (lastName ?? '').trim().charAt(0) ?? '';
	return `${first}${last}`.toUpperCase() || 'U';
}
