import { ForbiddenException } from '@nestjs/common';
import { ROLES } from '@repo/common';
import {
	assertCanReadSubjectAttendance,
	assertCanWriteSubjectAttendance,
} from '../../../src/modules/attendance/application/services/subject-access.policy';
import { Subject } from '../../../src/modules/attendance/domain/entities/subject.entity';

describe('subject access policy', () => {
	const subjectIn = (tenantId?: string) =>
		Subject.reconstitute('sub-1', 'course-1', 'Math', 'teacher-1', tenantId);

	describe.each([
		['read', assertCanReadSubjectAttendance],
		['write', assertCanWriteSubjectAttendance],
	])('%s access', (_label, assertAccess) => {
		it('allows an admin of the same tenant', () => {
			expect(() =>
				assertAccess(subjectIn('tenant-1'), {
					userId: 'admin-1',
					role: ROLES.ADMIN,
					tenantId: 'tenant-1',
				}),
			).not.toThrow();
		});

		it('rejects a cross-tenant admin', () => {
			expect(() =>
				assertAccess(subjectIn('tenant-1'), {
					userId: 'admin-1',
					role: ROLES.ADMIN,
					tenantId: 'other-tenant',
				}),
			).toThrow(ForbiddenException);
		});

		it('rejects when the subject tenant is unknown (empty)', () => {
			expect(() =>
				assertAccess(subjectIn(''), {
					userId: 'admin-1',
					role: ROLES.ADMIN,
					tenantId: 'tenant-1',
				}),
			).toThrow(ForbiddenException);
		});

		it('rejects when the subject tenant is not set', () => {
			expect(() =>
				assertAccess(subjectIn(), {
					userId: 'admin-1',
					role: ROLES.ADMIN,
					tenantId: 'tenant-1',
				}),
			).toThrow(ForbiddenException);
		});

		it('rejects when the actor tenant is missing', () => {
			expect(() =>
				assertAccess(subjectIn('tenant-1'), {
					userId: 'admin-1',
					role: ROLES.ADMIN,
					tenantId: '',
				}),
			).toThrow(ForbiddenException);
		});

		it('rejects when both tenants are empty', () => {
			expect(() =>
				assertAccess(subjectIn(''), {
					userId: 'admin-1',
					role: ROLES.ADMIN,
					tenantId: '',
				}),
			).toThrow(ForbiddenException);
		});
	});

	it('still lets a preceptor of the same tenant read but not write', () => {
		const actor = {
			userId: 'preceptor-1',
			role: ROLES.PRECEPTOR,
			tenantId: 'tenant-1',
		};
		expect(() =>
			assertCanReadSubjectAttendance(subjectIn('tenant-1'), actor),
		).not.toThrow();
		expect(() =>
			assertCanWriteSubjectAttendance(subjectIn('tenant-1'), actor),
		).toThrow(ForbiddenException);
	});
});
