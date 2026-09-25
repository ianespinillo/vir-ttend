import { ROLES } from '@repo/common';
import { describe, expect, it } from 'vitest';
import { DASHBOARD_CONFIGS, getDashboardConfig } from './dashboard-config.js';

describe('dashboard per-role config', () => {
	it('superadmin sees platform analytics and no course sections', () => {
		const config = getDashboardConfig(ROLES.SUPERADMIN);
		expect(config.view).toBe('superadmin-analytics');
		expect(config.metricsScope).toBe('school');
		expect(config.coursesScope).toBe('none');
		expect(config.headerTitle).toBe('Panel de Administración');
	});

	it('admin sees school-wide metrics and every school course', () => {
		const config = getDashboardConfig(ROLES.ADMIN);
		expect(config.view).toBe('preceptor-panel');
		expect(config.metricsScope).toBe('school');
		expect(config.coursesScope).toBe('school');
		expect(config.headerTitle).toBe('Panel Institucional');
	});

	it('preceptor sees own metrics and only the courses they manage', () => {
		const config = getDashboardConfig(ROLES.PRECEPTOR);
		expect(config.view).toBe('preceptor-panel');
		expect(config.metricsScope).toBe('own');
		expect(config.coursesScope).toBe('own');
		expect(config.headerTitle).toBe('Panel de Preceptoría');
	});

	it('teacher sees only the courses of their own subjects', () => {
		const config = getDashboardConfig(ROLES.TEACHER);
		expect(config.view).toBe('teacher-panel');
		expect(config.metricsScope).toBe('own');
		expect(config.coursesScope).toBe('own');
		expect(config.headerTitle).toBe('Mis cursos');
	});

	it('covers every product role', () => {
		const roles = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.PRECEPTOR, ROLES.TEACHER];
		expect(Object.keys(DASHBOARD_CONFIGS)).toHaveLength(roles.length);
		for (const role of roles) {
			expect(getDashboardConfig(role)).toBeDefined();
		}
	});
});
