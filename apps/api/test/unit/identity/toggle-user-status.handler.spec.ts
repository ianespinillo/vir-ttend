// toggle-user-status.handler.spec.ts
import { ForbiddenException } from '@nestjs/common';
import { ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { ToggleUserStatusCommand } from '../../../src/modules/identity/application/commands/toggle-user-status/toggle-user-status.command';
import { ToggleUserStatusHandler } from '../../../src/modules/identity/application/commands/toggle-user-status/toggle-user-status.handler';
import { UserTenantMembership } from '../../../src/modules/identity/domain/entities/user-tenant-membership.entity';
import { User } from '../../../src/modules/identity/domain/entities/user.entity';
import { IUserTenantMembershipRepository } from '../../../src/modules/identity/domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../src/modules/identity/domain/repositories/user.repository.interface';

describe('ToggleUserStatusHandler (single-tenant admin protections)', () => {
	const originalEnv = { ...process.env };
	let handler: ToggleUserStatusHandler;
	let userRepository: MockProxy<IUserRepository>;
	let membershipRepository: MockProxy<IUserTenantMembershipRepository>;

	const user = User.reconstitute({
		id: 'admin-2',
		email: 'admin2@tenant.com',
		passwordHash: 'hashed',
		firstName: 'Ada',
		lastName: 'Admin',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		mustChangePassword: false,
	});

	const adminMembership = () =>
		UserTenantMembership.reconstitute({
			id: 'membership-admin-2',
			userId: 'admin-2',
			tenantId: 'tenant-id',
			role: ROLES.ADMIN,
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

	const deactivate = (actorUserId: string) =>
		handler.execute(
			new ToggleUserStatusCommand(
				'admin-2',
				'tenant-id',
				ROLES.ADMIN,
				false,
				actorUserId,
			),
		);

	beforeEach(() => {
		process.env.TENANCY_MODE = 'single';
		process.env.TENANT_ID = 'tenant-id';
		process.env.TENANT_SLUG = 'school';
		userRepository = mock<IUserRepository>();
		membershipRepository = mock<IUserTenantMembershipRepository>();
		userRepository.findById.mockResolvedValue(user);
		membershipRepository.findByUserAndTenant.mockResolvedValue(adminMembership());
		handler = new ToggleUserStatusHandler(userRepository, membershipRepository);
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it('deactivates another admin when at least two admins are active', async () => {
		membershipRepository.countActiveByTenantAndRole.mockResolvedValue(2);
		membershipRepository.findByUserId.mockResolvedValue([]);

		await deactivate('actor-id');

		expect(membershipRepository.save.mock.calls[0][0].isActive).toBe(false);
	});

	it('rejects deactivating the last active admin', async () => {
		membershipRepository.countActiveByTenantAndRole.mockResolvedValue(1);

		await expect(deactivate('actor-id')).rejects.toThrow(ForbiddenException);
		expect(membershipRepository.save).not.toHaveBeenCalled();
	});

	it('rejects self-deactivation', async () => {
		await expect(deactivate('admin-2')).rejects.toThrow(ForbiddenException);
		expect(membershipRepository.save).not.toHaveBeenCalled();
	});
});
