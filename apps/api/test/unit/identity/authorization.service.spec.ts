import { ROLES } from '@repo/common';
import { AuthorizationService } from '../../../src/modules/identity/domain/services/authorization.service';

// authorization.service.spec.ts
describe('AuthorizationService', () => {
	describe('canManageRole', () => {
		it('superadmin can manage admin', () => {
			expect(
				AuthorizationService.canManageRole(ROLES.SUPERADMIN, ROLES.ADMIN),
			).toBe(true);
		});

		it('admin can manage preceptor', () => {
			expect(
				AuthorizationService.canManageRole(ROLES.ADMIN, ROLES.PRECEPTOR),
			).toBe(true);
		});

		it('admin can manage teacher', () => {
			expect(AuthorizationService.canManageRole(ROLES.ADMIN, ROLES.TEACHER)).toBe(
				true,
			);
		});

		it('admin cannot manage admin', () => {
			expect(AuthorizationService.canManageRole(ROLES.ADMIN, ROLES.ADMIN)).toBe(
				false,
			);
		});

		it('preceptor cannot manage anyone', () => {
			expect(
				AuthorizationService.canManageRole(ROLES.PRECEPTOR, ROLES.TEACHER),
			).toBe(false);
		});

		it('teacher cannot manage anyone', () => {
			expect(
				AuthorizationService.canManageRole(ROLES.TEACHER, ROLES.PRECEPTOR),
			).toBe(false);
		});
	});

	describe('tenancy mode', () => {
		it('single: admin can manage and create admin', () => {
			expect(
				AuthorizationService.canManageRole(ROLES.ADMIN, ROLES.ADMIN, 'single'),
			).toBe(true);
			expect(
				AuthorizationService.canCreateRole(ROLES.ADMIN, ROLES.ADMIN, 'single'),
			).toBe(true);
		});

		it('single: admin cannot manage or create superadmin', () => {
			expect(
				AuthorizationService.canManageRole(ROLES.ADMIN, ROLES.SUPERADMIN, 'single'),
			).toBe(false);
			expect(
				AuthorizationService.canCreateRole(ROLES.ADMIN, ROLES.SUPERADMIN, 'single'),
			).toBe(false);
		});

		it('multi: admin cannot manage or create admin', () => {
			expect(
				AuthorizationService.canManageRole(ROLES.ADMIN, ROLES.ADMIN, 'multi'),
			).toBe(false);
			expect(
				AuthorizationService.canCreateRole(ROLES.ADMIN, ROLES.ADMIN, 'multi'),
			).toBe(false);
		});

		it('single: preceptor still cannot manage anyone', () => {
			expect(
				AuthorizationService.canManageRole(ROLES.PRECEPTOR, ROLES.ADMIN, 'single'),
			).toBe(false);
		});
	});

	describe('canAccessTenant', () => {
		it('superadmin can access any tenant', () => {
			expect(AuthorizationService.canAccessTenant(null, 'tenant-id')).toBe(true);
		});

		it('user can access their own tenant', () => {
			expect(AuthorizationService.canAccessTenant('tenant-id', 'tenant-id')).toBe(
				true,
			);
		});

		it('user cannot access another tenant', () => {
			expect(AuthorizationService.canAccessTenant('tenant-a', 'tenant-b')).toBe(
				false,
			);
		});
	});
});
