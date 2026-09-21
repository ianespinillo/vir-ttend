import { describe, expect, it } from 'vitest';
import {
	allowedRolesForPathname,
	getNavConfig,
	isPathAllowedForRole,
	requireRole,
} from './nav';
import { ROLES } from './roles.enum';

describe('allowedRolesForPathname', () => {
	it('grants /tenants only to superadmin', () => {
		expect(allowedRolesForPathname('/tenants')).toEqual([ROLES.SUPERADMIN]);
		expect(allowedRolesForPathname('/tenants/abc')).toEqual([ROLES.SUPERADMIN]);
	});

	it('grants /dashboard to superadmin, admin, preceptor', () => {
		expect(allowedRolesForPathname('/dashboard')).toEqual([
			ROLES.SUPERADMIN,
			ROLES.ADMIN,
			ROLES.PRECEPTOR,
		]);
	});

	it('grants /courses to admin and preceptor', () => {
		expect(allowedRolesForPathname('/courses')).toEqual([
			ROLES.ADMIN,
			ROLES.PRECEPTOR,
		]);
		expect(allowedRolesForPathname('/courses/abc')).toEqual([
			ROLES.ADMIN,
			ROLES.PRECEPTOR,
		]);
	});

	it('grants /students to admin and preceptor', () => {
		expect(allowedRolesForPathname('/students')).toEqual([
			ROLES.ADMIN,
			ROLES.PRECEPTOR,
		]);
	});

	it('grants /attendance/daily to admin and preceptor', () => {
		expect(allowedRolesForPathname('/attendance/daily')).toEqual([
			ROLES.ADMIN,
			ROLES.PRECEPTOR,
		]);
	});

	it('grants /attendance/subject only to teacher', () => {
		expect(allowedRolesForPathname('/attendance/subject')).toEqual([
			ROLES.TEACHER,
		]);
	});

	it('grants /alerts to admin and preceptor', () => {
		expect(allowedRolesForPathname('/alerts')).toEqual([
			ROLES.ADMIN,
			ROLES.PRECEPTOR,
		]);
	});

	it('grants /reports to admin and preceptor', () => {
		expect(allowedRolesForPathname('/reports')).toEqual([
			ROLES.ADMIN,
			ROLES.PRECEPTOR,
		]);
	});

	it('grants /me/announcements to all roles', () => {
		expect(allowedRolesForPathname('/me/announcements')).toEqual([
			ROLES.SUPERADMIN,
			ROLES.ADMIN,
			ROLES.PRECEPTOR,
			ROLES.TEACHER,
		]);
	});

	it('grants /announcements list and create to admin and preceptor', () => {
		expect(allowedRolesForPathname('/announcements')).toEqual([
			ROLES.ADMIN,
			ROLES.PRECEPTOR,
		]);
		expect(allowedRolesForPathname('/announcements/create')).toEqual([
			ROLES.ADMIN,
			ROLES.PRECEPTOR,
		]);
	});

	it('grants /announcements/:id/edit to admin and preceptor', () => {
		expect(allowedRolesForPathname('/announcements/abc/edit')).toEqual([
			ROLES.ADMIN,
			ROLES.PRECEPTOR,
		]);
	});

	it('grants /announcements/:id detail to all roles', () => {
		expect(allowedRolesForPathname('/announcements/abc')).toEqual([
			ROLES.SUPERADMIN,
			ROLES.ADMIN,
			ROLES.PRECEPTOR,
			ROLES.TEACHER,
		]);
	});

	it('grants /users to superadmin and admin', () => {
		expect(allowedRolesForPathname('/users')).toEqual([
			ROLES.SUPERADMIN,
			ROLES.ADMIN,
		]);
	});

	it('grants /settings/profile to all roles', () => {
		expect(allowedRolesForPathname('/settings/profile')).toEqual([
			ROLES.SUPERADMIN,
			ROLES.ADMIN,
			ROLES.PRECEPTOR,
			ROLES.TEACHER,
		]);
	});

	it('grants /settings/users to superadmin and admin', () => {
		expect(allowedRolesForPathname('/settings/users')).toEqual([
			ROLES.SUPERADMIN,
			ROLES.ADMIN,
		]);
	});

	it('grants /settings/tenant only to admin', () => {
		expect(allowedRolesForPathname('/settings/tenant')).toEqual([ROLES.ADMIN]);
	});

	it('grants /settings/academic only to admin', () => {
		expect(allowedRolesForPathname('/settings/academic')).toEqual([ROLES.ADMIN]);
	});

	it('grants unknown paths to all roles', () => {
		expect(allowedRolesForPathname('/unknown')).toEqual([
			ROLES.SUPERADMIN,
			ROLES.ADMIN,
			ROLES.PRECEPTOR,
			ROLES.TEACHER,
		]);
	});
});

describe('isPathAllowedForRole', () => {
	it('allows superadmin to access /tenants', () => {
		expect(isPathAllowedForRole('/tenants', ROLES.SUPERADMIN)).toBe(true);
	});

	it('denies teacher access to /tenants', () => {
		expect(isPathAllowedForRole('/tenants', ROLES.TEACHER)).toBe(false);
	});

	it('allows teacher access to /attendance/subject', () => {
		expect(isPathAllowedForRole('/attendance/subject', ROLES.TEACHER)).toBe(true);
	});

	it('denies preceptor access to /attendance/subject', () => {
		expect(isPathAllowedForRole('/attendance/subject', ROLES.PRECEPTOR)).toBe(
			false,
		);
	});

	it('allows admin access to /settings/academic', () => {
		expect(isPathAllowedForRole('/settings/academic', ROLES.ADMIN)).toBe(true);
	});

	it('denies preceptor access to /settings/academic', () => {
		expect(isPathAllowedForRole('/settings/academic', ROLES.PRECEPTOR)).toBe(
			false,
		);
	});

	it('allows all roles to access /settings/profile', () => {
		for (const role of Object.values(ROLES)) {
			expect(isPathAllowedForRole('/settings/profile', role)).toBe(true);
		}
	});
});

describe('requireRole', () => {
	it('returns true when role is in the allowed list', () => {
		expect(requireRole(ROLES.ADMIN, [ROLES.ADMIN, ROLES.PRECEPTOR])).toBe(true);
	});

	it('returns false when role is not in the allowed list', () => {
		expect(requireRole(ROLES.TEACHER, [ROLES.ADMIN, ROLES.PRECEPTOR])).toBe(
			false,
		);
	});
});

describe('getNavConfig', () => {
	it('returns only superadmin-allowed items for superadmin', () => {
		const config = getNavConfig(ROLES.SUPERADMIN);
		const items = config.flatMap((g) => g.items);
		const hrefs = items.map((i) => i.href);

		expect(hrefs).toContain('/tenants');
		expect(hrefs).toContain('/dashboard');
		expect(hrefs).not.toContain('/courses');
		expect(hrefs).not.toContain('/attendance/daily');
	});

	it('returns teacher-specific items for teacher', () => {
		const config = getNavConfig(ROLES.TEACHER);
		const items = config.flatMap((g) => g.items);
		const hrefs = items.map((i) => i.href);

		expect(hrefs).toContain('/attendance/subject');
		expect(hrefs).toContain('/settings/profile');
		expect(hrefs).not.toContain('/dashboard');
		expect(hrefs).not.toContain('/tenants');
	});

	it('returns preceptor items including attendance and alerts', () => {
		const config = getNavConfig(ROLES.PRECEPTOR);
		const items = config.flatMap((g) => g.items);
		const hrefs = items.map((i) => i.href);

		expect(hrefs).toContain('/dashboard');
		expect(hrefs).toContain('/attendance/daily');
		expect(hrefs).toContain('/alerts');
		expect(hrefs).toContain('/reports');
		expect(hrefs).not.toContain('/tenants');
	});
});
