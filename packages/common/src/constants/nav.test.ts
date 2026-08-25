import { describe, expect, it } from 'vitest';
import { APP_ROUTES } from '../routes/app.routes.js';
import {
	ALL_NAV_ITEMS,
	allowedRolesForPathname,
	getNavConfig,
	requireRole,
} from './nav.js';
import { ROLES } from './roles.enum.js';

describe('Nav Constants & Helpers', () => {
	it('should return correct items per role', () => {
		const superAdminNav = getNavConfig(ROLES.SUPERADMIN);
		const adminNav = getNavConfig(ROLES.ADMIN);
		const preceptorNav = getNavConfig(ROLES.PRECEPTOR);
		const teacherNav = getNavConfig(ROLES.TEACHER);

		expect(superAdminNav[0].items.map((i) => i.href)).toContain(
			APP_ROUTES.tenants,
		);
		expect(superAdminNav[0].items.map((i) => i.href)).not.toContain(
			APP_ROUTES.students,
		);

		expect(adminNav[0].items.map((i) => i.href)).toContain(APP_ROUTES.dashboard);
		expect(adminNav[0].items.map((i) => i.href)).toContain(APP_ROUTES.students);

		expect(preceptorNav[0].items.map((i) => i.href)).toContain(
			APP_ROUTES.attendanceDaily,
		);

		expect(teacherNav[0].items.map((i) => i.href)).toContain(
			APP_ROUTES.attendanceSubject,
		);
		expect(teacherNav[0].items.map((i) => i.href)).not.toContain(
			APP_ROUTES.tenants,
		);
	});

	it('should check allowed roles for pathname', () => {
		expect(allowedRolesForPathname('/tenants')).toEqual([ROLES.SUPERADMIN]);
		expect(allowedRolesForPathname('/students')).toEqual([
			ROLES.ADMIN,
			ROLES.PRECEPTOR,
		]);
	});

	it('should validate path permission via requireRole', () => {
		const allowed = allowedRolesForPathname('/tenants');
		expect(requireRole(ROLES.SUPERADMIN, allowed)).toBe(true);
		expect(requireRole(ROLES.TEACHER, allowed)).toBe(false);
	});
});

describe('Announcements navigation split', () => {
	it('teacher accede a para-mi y al detalle, pero no a gestion', () => {
		expect(
			requireRole(ROLES.TEACHER, allowedRolesForPathname('/me/announcements')),
		).toBe(true);
		expect(
			requireRole(
				ROLES.TEACHER,
				allowedRolesForPathname(
					`${APP_ROUTES.announcements}/9a999999-9999-4999-8999-999999999999`,
				),
			),
		).toBe(true);

		expect(
			requireRole(ROLES.TEACHER, allowedRolesForPathname('/announcements')),
		).toBe(false);
		expect(
			requireRole(ROLES.TEACHER, allowedRolesForPathname('/announcements/create')),
		).toBe(false);
		expect(
			requireRole(ROLES.TEACHER, allowedRolesForPathname('/announcements/x/edit')),
		).toBe(false);
	});

	it('preceptor y admin acceden a gestion', () => {
		expect(
			requireRole(ROLES.ADMIN, allowedRolesForPathname('/announcements')),
		).toBe(true);
		expect(
			requireRole(ROLES.PRECEPTOR, allowedRolesForPathname('/announcements')),
		).toBe(true);
	});

	it('getNavConfig(teacher) incluye Para mi pero NO Comunicados', () => {
		const hrefs = getNavConfig(ROLES.TEACHER)[0].items.map((i) => i.href);
		expect(hrefs).toContain(APP_ROUTES.meAnnouncements);
		expect(hrefs).not.toContain(APP_ROUTES.announcements);
	});
});
