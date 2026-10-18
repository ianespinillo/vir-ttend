import { APP_ROUTES, ROLES, getNavConfig } from '@repo/common';
import { describe, expect, it } from 'vitest';
import { TOUR_NAV_COPY } from './tour-content';
import {
	TOUR_TRIGGER_SELECTOR,
	buildTourSteps,
	getTutorialsForRole,
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

describe('getTutorialsForRole', () => {
	it('always provides the onboarding tour for all roles', () => {
		for (const role of ALL_ROLES) {
			const tutorials = getTutorialsForRole(role);
			expect(tutorials.length).toBeGreaterThanOrEqual(1);
			expect(tutorials[0]?.id).toBe('onboarding');
			expect(tutorials[0]?.title).toBe('Tour general de la plataforma');
			expect(tutorials[0]?.steps.length).toBeGreaterThan(0);
		}
	});

	it('provides comprehensive functional guides for admin', () => {
		const adminTutorials = getTutorialsForRole(ROLES.ADMIN);
		const ids = adminTutorials.map((t) => t.id);

		expect(ids).toContain('onboarding');
		expect(ids).toContain('attendance-daily');
		expect(ids).toContain('students-import');
		expect(ids).toContain('student-history');
		expect(ids).toContain('academic-config');
		expect(ids).toContain('announcements');
	});

	it('provides relevant guides for preceptor without academic config', () => {
		const preceptorTutorials = getTutorialsForRole(ROLES.PRECEPTOR);
		const ids = preceptorTutorials.map((t) => t.id);

		expect(ids).toContain('onboarding');
		expect(ids).toContain('attendance-daily');
		expect(ids).toContain('students-import');
		expect(ids).toContain('student-history');
		expect(ids).toContain('announcements');
		expect(ids).not.toContain('academic-config');
		expect(ids).not.toContain('attendance-subject');
	});

	it('provides subject attendance guide for teacher only', () => {
		const teacherTutorials = getTutorialsForRole(ROLES.TEACHER);
		const ids = teacherTutorials.map((t) => t.id);

		expect(ids).toContain('onboarding');
		expect(ids).toContain('attendance-subject');
		expect(ids).not.toContain('attendance-daily');
		expect(ids).not.toContain('academic-config');
	});

	it('filters out tutorials whose primary route is in excludeHrefs', () => {
		const withoutDaily = getTutorialsForRole(ROLES.ADMIN, {
			excludeHrefs: [APP_ROUTES.attendanceDaily, APP_ROUTES.announcements],
		});
		const ids = withoutDaily.map((t) => t.id);

		expect(ids).not.toContain('attendance-daily');
		expect(ids).not.toContain('announcements');
		expect(ids).toContain('students-import');
	});

	it('ensures all steps in each tutorial have id, title, and body', () => {
		for (const role of ALL_ROLES) {
			const tutorials = getTutorialsForRole(role);
			for (const tutorial of tutorials) {
				expect(tutorial.title).toBeTruthy();
				expect(tutorial.description).toBeTruthy();
				expect(tutorial.steps.length).toBeGreaterThan(0);
				for (const step of tutorial.steps) {
					expect(step.id).toBeTruthy();
					expect(step.title).toBeTruthy();
					expect(step.body).toBeTruthy();
				}
			}
		}
	});
});
