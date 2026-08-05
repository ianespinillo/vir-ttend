import {
	AUTH_ROUTES,
	REPORT_ROUTES,
	STUDENT_ROUTES,
	TENANT_ROUTES,
	USER_ROUTES,
} from '@repo/common';
import { describe, expect, it } from 'vitest';

describe('Contrato de rutas vs apps/api/README.md', () => {
	it('AUTH_ROUTES cubre la tabla de endpoints de Auth e Identity', () => {
		expect(AUTH_ROUTES.login).toBe('/auth/login');
		expect(AUTH_ROUTES.selectTenant).toBe('/auth/select-tenant');
		expect(AUTH_ROUTES.refresh).toBe('/auth/refresh');
		expect(AUTH_ROUTES.logout).toBe('/auth/logout');
	});

	it('USER_ROUTES cubre los endpoints de usuarios', () => {
		expect(USER_ROUTES.users).toBe('/users');
		expect(USER_ROUTES.me).toBe('/users/me');
		expect(USER_ROUTES.changeRole('u1')).toBe('/users/u1/role');
	});

	it('TENANT_ROUTES cubre los endpoints de tenants', () => {
		expect(TENANT_ROUTES.tenants).toBe('/tenants');
		expect(TENANT_ROUTES.tenant('t1')).toBe('/tenants/t1');
		expect(TENANT_ROUTES.status('t1')).toBe('/tenants/t1/status');
	});

	it('STUDENT_ROUTES cubre los endpoints de estudiantes', () => {
		expect(STUDENT_ROUTES.students).toBe('/students');
		expect(STUDENT_ROUTES.search).toBe('/students/search');
		expect(STUDENT_ROUTES.enroll('s1')).toBe('/students/s1/enroll');
		expect(STUDENT_ROUTES.transfer('s1')).toBe('/students/s1/transfer');
	});

	it('REPORT_ROUTES cubre los endpoints de reportes y exportación', () => {
		expect(REPORT_ROUTES.monthly).toBe('/reports/monthly');
		expect(REPORT_ROUTES.generate).toBe('/reports/generate');
		expect(REPORT_ROUTES.courseSummary('c1')).toBe('/reports/course/c1/summary');
		expect(REPORT_ROUTES.available('c1')).toBe('/reports/course/c1/available');
		expect(REPORT_ROUTES.byStudent('s1')).toBe('/reports/student/s1');
		expect(REPORT_ROUTES.exportExcel).toBe('/reports/export/excel');
		expect(REPORT_ROUTES.exportPdf).toBe('/reports/export/pdf');
	});
});
