import { APP_ROUTES, ROLES, isPathAllowedForRole } from '@repo/common';
import { describe, expect, it } from 'vitest';
import { createSeedState, demoIds } from '../store/seed-data';
import {
	PROFILE_DESCRIPTORS,
	ROLE_LABELS,
	allowedPathsForRole,
	getDemoProfiles,
	getInitials,
} from './helpers';

describe('role labels', () => {
	it('maps every role to its Spanish product label', () => {
		expect(ROLE_LABELS[ROLES.SUPERADMIN]).toBe('Super Admin');
		expect(ROLE_LABELS[ROLES.ADMIN]).toBe('Administrador');
		expect(ROLE_LABELS[ROLES.PRECEPTOR]).toBe('Preceptor');
		expect(ROLE_LABELS[ROLES.TEACHER]).toBe('Docente');
	});
});

describe('allowedPathsForRole', () => {
	it('lets superadmin open global + all-role modules', () => {
		const paths = allowedPathsForRole(ROLES.SUPERADMIN);
		expect(paths).toEqual([
			APP_ROUTES.tenants,
			APP_ROUTES.dashboard,
			APP_ROUTES.meAnnouncements,
			APP_ROUTES.settingsUsers,
			APP_ROUTES.profile,
		]);
	});

	it('lets admin open every school module except teacher subjects', () => {
		const paths = allowedPathsForRole(ROLES.ADMIN);
		expect(paths).toEqual([
			APP_ROUTES.dashboard,
			APP_ROUTES.courses,
			APP_ROUTES.students,
			APP_ROUTES.attendanceDaily,
			APP_ROUTES.alerts,
			APP_ROUTES.reports,
			APP_ROUTES.announcements,
			APP_ROUTES.meAnnouncements,
			APP_ROUTES.settingsUsers,
			APP_ROUTES.settingsTenant,
			APP_ROUTES.settingsAcademic,
			APP_ROUTES.profile,
		]);
	});

	it('lets preceptor open teaching assistants core modules', () => {
		const paths = allowedPathsForRole(ROLES.PRECEPTOR);
		expect(paths).toEqual([
			APP_ROUTES.dashboard,
			APP_ROUTES.courses,
			APP_ROUTES.students,
			APP_ROUTES.attendanceDaily,
			APP_ROUTES.alerts,
			APP_ROUTES.reports,
			APP_ROUTES.announcements,
			APP_ROUTES.meAnnouncements,
			APP_ROUTES.profile,
		]);
	});

	it('restricts teacher to subjects and profile', () => {
		const paths = allowedPathsForRole(ROLES.TEACHER);
		expect(paths).toEqual([
			APP_ROUTES.attendanceSubject,
			APP_ROUTES.meAnnouncements,
			APP_ROUTES.profile,
		]);
		expect(paths).not.toContain(APP_ROUTES.students);
		expect(paths).not.toContain(APP_ROUTES.dashboard);
	});

	it('only returns paths the shared guard actually allows', () => {
		for (const role of [
			ROLES.SUPERADMIN,
			ROLES.ADMIN,
			ROLES.PRECEPTOR,
			ROLES.TEACHER,
		]) {
			const paths = allowedPathsForRole(role);
			expect(paths.length).toBeGreaterThan(0);
			for (const path of paths) {
				expect(isPathAllowedForRole(path, role)).toBe(true);
			}
		}
	});
});

describe('demo profiles', () => {
	it('returns the five institutional profiles in seed order, excluding superadmin', () => {
		const state = createSeedState();
		const profiles = getDemoProfiles(state);
		expect(profiles).toHaveLength(5);
		expect(profiles.some((p) => p.user.role === ROLES.SUPERADMIN)).toBe(false);
		expect(profiles[0]).toMatchObject({
			user: { firstName: 'Ana', lastName: 'Gómez', role: ROLES.ADMIN },
			tenantName: 'Colegio San Martín',
		});
		expect(profiles.at(-1)?.user.lastName).toBe('Fernández');
	});

	it('ignores users created during a demo session', () => {
		const state = createSeedState();
		state.users.push({
			id: 'created-user-1',
			email: 'nuevo@demo.com',
			firstName: 'Nuevo',
			lastName: 'Usuario',
			role: ROLES.ADMIN,
			tenantId: demoIds.tenant['san-martin'],
			isActive: true,
			mustChangePassword: true,
			createdAt: '2026-06-19T12:00:00.000Z',
		});
		expect(getDemoProfiles(state)).toHaveLength(5);
	});

	it('describes every canonical profile', () => {
		const state = createSeedState();
		expect(Object.keys(PROFILE_DESCRIPTORS)).toHaveLength(6);
		for (const profile of getDemoProfiles(state)) {
			expect(PROFILE_DESCRIPTORS[profile.user.id]).toBeTruthy();
		}
	});
});

describe('getInitials', () => {
	it('builds product-style initials', () => {
		expect(getInitials('Ana', 'Gómez')).toBe('AG');
		expect(getInitials('Carlos', 'Ramos')).toBe('CR');
		expect(getInitials('', 'Ramos')).toBe('R');
		expect(getInitials()).toBe('U');
	});
});
