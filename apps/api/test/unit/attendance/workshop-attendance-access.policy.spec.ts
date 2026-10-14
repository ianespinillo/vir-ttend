import { ForbiddenException } from '@nestjs/common';
import { ROLES } from '@repo/common';
import { assertCanManageWorkshopAttendance } from '../../../src/modules/attendance/application/services/workshop-attendance-access.policy';
import {
	TENANT,
	asPreceptor,
	commission,
} from './workshop-attendance.fixtures';

describe('workshop attendance access policy', () => {
	it('allows an admin of the tenant', () => {
		expect(() =>
			assertCanManageWorkshopAttendance(commission(), {
				userId: 'admin-1',
				role: ROLES.ADMIN,
				tenantId: TENANT,
			}),
		).not.toThrow();
	});

	it('allows the preceptor assigned to the commission', () => {
		expect(() =>
			assertCanManageWorkshopAttendance(commission(), asPreceptor()),
		).not.toThrow();
	});

	it('rejects another preceptor', () => {
		expect(() =>
			assertCanManageWorkshopAttendance(commission(), asPreceptor('other')),
		).toThrow(ForbiddenException);
	});

	it('rejects any preceptor when the commission has no preceptor', () => {
		expect(() =>
			assertCanManageWorkshopAttendance(
				commission({ preceptorId: null }),
				asPreceptor(),
			),
		).toThrow(ForbiddenException);
	});

	it('rejects a teacher', () => {
		expect(() =>
			assertCanManageWorkshopAttendance(commission(), {
				userId: 'teacher-1',
				role: ROLES.TEACHER,
				tenantId: TENANT,
			}),
		).toThrow(ForbiddenException);
	});

	it('rejects a cross-tenant admin', () => {
		expect(() =>
			assertCanManageWorkshopAttendance(commission(), {
				userId: 'admin-1',
				role: ROLES.ADMIN,
				tenantId: 'other-tenant',
			}),
		).toThrow(ForbiddenException);
	});
});
