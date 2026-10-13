// change-membership-role.handler.spec.ts
import { ForbiddenException } from '@nestjs/common';
import { ROLES, type Roles } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { ChangeMembershipRoleCommand } from '../../../src/modules/identity/application/commands/change-membership-role/change-membership-role.command';
import { ChangeMembershipRoleHandler } from '../../../src/modules/identity/application/commands/change-membership-role/change-membership-role.handler';
import { UserTenantMembership } from '../../../src/modules/identity/domain/entities/user-tenant-membership.entity';
import { IUserTenantMembershipRepository } from '../../../src/modules/identity/domain/repositories/user-tenant-membership.repository.interface';

describe('ChangeMembershipRoleHandler', () => {
	let handler: ChangeMembershipRoleHandler;
	let membershipRepository: MockProxy<IUserTenantMembershipRepository>;

	const mockMembership = UserTenantMembership.reconstitute({
		id: 'membership-id',
		userId: 'user-id',
		tenantId: 'tenant-id',
		role: ROLES.PRECEPTOR,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	beforeEach(() => {
		membershipRepository = mock<IUserTenantMembershipRepository>();

		handler = new ChangeMembershipRoleHandler(membershipRepository);
	});

	it('should change role when actor has permission', async () => {
		membershipRepository.findByUserAndTenant.mockResolvedValue(mockMembership);

		await handler.execute(
			new ChangeMembershipRoleCommand(
				'user-id',
				'tenant-id',
				ROLES.TEACHER,
				ROLES.ADMIN,
				'actor-id',
			),
		);

		expect(membershipRepository.save).toHaveBeenCalledTimes(1);
		const saved = membershipRepository.save.mock.calls[0][0];
		expect(saved.role).toBe(ROLES.TEACHER);
	});

	describe('single-tenant admin management', () => {
		const originalEnv = { ...process.env };

		const membershipOf = (userId: string, role: Roles) =>
			UserTenantMembership.reconstitute({
				id: `membership-${userId}`,
				userId,
				tenantId: 'tenant-id',
				role,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

		const change = (userId: string, newRole: Roles) =>
			handler.execute(
				new ChangeMembershipRoleCommand(
					userId,
					'tenant-id',
					newRole,
					ROLES.ADMIN,
					'actor-id',
				),
			);

		beforeEach(() => {
			process.env.TENANCY_MODE = 'single';
			process.env.TENANT_ID = 'tenant-id';
			process.env.TENANT_SLUG = 'school';
		});

		afterEach(() => {
			process.env = { ...originalEnv };
		});

		it('promotes a teacher to admin', async () => {
			membershipRepository.findByUserAndTenant.mockResolvedValue(
				membershipOf('teacher-id', ROLES.TEACHER),
			);

			await change('teacher-id', ROLES.ADMIN);

			expect(membershipRepository.save.mock.calls[0][0].role).toBe(ROLES.ADMIN);
		});

		it('demotes another admin when at least two admins are active', async () => {
			membershipRepository.findByUserAndTenant.mockResolvedValue(
				membershipOf('admin-2', ROLES.ADMIN),
			);
			membershipRepository.countActiveByTenantAndRole.mockResolvedValue(2);

			await change('admin-2', ROLES.TEACHER);

			expect(membershipRepository.save.mock.calls[0][0].role).toBe(ROLES.TEACHER);
		});

		it('rejects demoting the last active admin', async () => {
			membershipRepository.findByUserAndTenant.mockResolvedValue(
				membershipOf('admin-2', ROLES.ADMIN),
			);
			membershipRepository.countActiveByTenantAndRole.mockResolvedValue(1);

			await expect(change('admin-2', ROLES.TEACHER)).rejects.toThrow(
				ForbiddenException,
			);
			expect(membershipRepository.save).not.toHaveBeenCalled();
		});

		it('rejects changing the own role', async () => {
			await expect(change('actor-id', ROLES.TEACHER)).rejects.toThrow(
				ForbiddenException,
			);
			expect(membershipRepository.save).not.toHaveBeenCalled();
		});

		it('keeps multi mode unchanged: admin cannot assign admin', async () => {
			process.env.TENANCY_MODE = 'multi';

			await expect(change('teacher-id', ROLES.ADMIN)).rejects.toThrow();
			expect(membershipRepository.save).not.toHaveBeenCalled();
		});
	});

	it('should throw when actor lacks permission', async () => {
		await expect(
			handler.execute(
				new ChangeMembershipRoleCommand(
					'user-id',
					'tenant-id',
					ROLES.TEACHER,
					ROLES.PRECEPTOR,
					'actor-id',
				),
			),
		).rejects.toThrow();

		expect(membershipRepository.save).not.toHaveBeenCalled();
	});

	it('should throw when membership does not exist', async () => {
		membershipRepository.findByUserAndTenant.mockResolvedValue(null);

		await expect(
			handler.execute(
				new ChangeMembershipRoleCommand(
					'user-id',
					'tenant-id',
					ROLES.TEACHER,
					ROLES.ADMIN,
					'actor-id',
				),
			),
		).rejects.toThrow();

		expect(membershipRepository.save).not.toHaveBeenCalled();
	});
});
