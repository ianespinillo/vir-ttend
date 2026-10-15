import { APP_ROUTES, ROLES, getNavConfig } from '@repo/common';
import { describe, expect, it } from 'vitest';
import { TOUR_NAV_COPY } from './tour-content';
import {
	TOUR_TRIGGER_SELECTOR,
	buildTourSteps,
	isOnRoute,
	navTourSelector,
} from './tour-steps';

const ALL_ROLES = Object.values(ROLES);

describe('buildTourSteps', () => {
	it.each(ALL_ROLES)(
		'walks the %s navigation between a welcome and a closing step',
		(role) => {
			const steps = buildTourSteps(role);
			const navHrefs = getNavConfig(role)
				.flatMap((group) => group.items)
				.map((item) => item.href);

			expect(steps[0]?.id).toBe('welcome');
			expect(steps.at(-1)?.id).toBe('finish');
			expect(steps.at(-1)?.target).toBe(TOUR_TRIGGER_SELECTOR);
			expect(steps.filter((step) => step.route).map((step) => step.route)).toEqual(
				navHrefs,
			);
		},
	);

	it('has copy for every navigation entry', () => {
		for (const role of ALL_ROLES) {
			for (const item of getNavConfig(role).flatMap((group) => group.items)) {
				expect(TOUR_NAV_COPY[item.href], item.href).toBeDefined();
			}
		}
	});

	it('spotlights the sidebar entry of each page', () => {
		const step = buildTourSteps(ROLES.ADMIN).find(
			(candidate) => candidate.route === APP_ROUTES.students,
		);
		expect(step?.target).toBe(navTourSelector(APP_ROUTES.students));
		expect(step?.title).toBe('Estudiantes');
		expect(step?.tips?.length).toBeGreaterThan(0);
	});

	it('uses the role-specific copy when there is one', () => {
		const superadmin = buildTourSteps(ROLES.SUPERADMIN).find(
			(step) => step.route === APP_ROUTES.dashboard,
		);
		const preceptor = buildTourSteps(ROLES.PRECEPTOR).find(
			(step) => step.route === APP_ROUTES.dashboard,
		);
		expect(superadmin?.body).not.toBe(preceptor?.body);
	});

	it('leaves out the excluded entries', () => {
		const steps = buildTourSteps(ROLES.PRECEPTOR, {
			excludeHrefs: [APP_ROUTES.attendanceWorkshop],
		});
		expect(steps.map((step) => step.route)).not.toContain(
			APP_ROUTES.attendanceWorkshop,
		);
	});

	it('shows the tenant switcher to the superadmin only in multi-tenant mode', () => {
		const multi = buildTourSteps(ROLES.SUPERADMIN).map((step) => step.id);
		const single = buildTourSteps(ROLES.SUPERADMIN, {
			tenancyMode: 'single',
		}).map((step) => step.id);
		expect(multi).toContain('tenant-switcher');
		expect(single).not.toContain('tenant-switcher');
		expect(single).not.toContain(`nav:${APP_ROUTES.tenants}`);
		expect(buildTourSteps(ROLES.ADMIN).map((step) => step.id)).not.toContain(
			'tenant-switcher',
		);
	});
});

describe('isOnRoute', () => {
	it('matches the page and its sub-pages', () => {
		expect(isOnRoute('/students', '/students')).toBe(true);
		expect(isOnRoute('/students/42', '/students')).toBe(true);
		expect(isOnRoute('/reports/monthly', '/reports')).toBe(true);
		expect(isOnRoute('/studentsx', '/students')).toBe(false);
	});

	it('treats the dashboard as an exact match', () => {
		expect(isOnRoute('/dashboard', '/dashboard')).toBe(true);
		expect(isOnRoute('/dashboard/other', '/dashboard')).toBe(false);
	});
});
