// deactivate-membership.handler.spec.ts
import { ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { DeactivateMembershipCommand } from '../../../src/modules/identity/application/commands/deactivate-membership/deactivate-membership.command';
import { DeactivateMembershipHandler } from '../../../src/modules/identity/application/commands/deactivate-membership/deactivate-membership.handler';
import { UserTenantMembership } from '../../../src/modules/identity/domain/entities/user-tenant-membership.entity';
import { IUserTenantMembershipRepository } from '../../../src/modules/identity/domain/repositories/user-tenant-membership.repository.interface';

describe('DeactivateMembershipHandler', () => {
	let handler: DeactivateMembershipHandler;
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
		handler = new DeactivateMembershipHandler(membershipRepository);
	});

	it('should deactivate membership when actor has permission', async () => {
		membershipRepository.findByUserAndTenant.mockResolvedValue(mockMembership);

		await handler.execute(
			new DeactivateMembershipCommand('user-id', 'tenant-id', ROLES.ADMIN),
		);

		expect(membershipRepository.save).toHaveBeenCalledTimes(1);
		const saved = membershipRepository.save.mock.calls[0][0];
		expect(saved.isActive).toBe(false);
	});

	it('should throw when actor lacks permission', async () => {
		await expect(
			handler.execute(
				new DeactivateMembershipCommand('user-id', 'tenant-id', ROLES.PRECEPTOR),
			),
		).rejects.toThrow();

		expect(membershipRepository.save).not.toHaveBeenCalled();
	});

	it('should throw when membership does not exist', async () => {
		membershipRepository.findByUserAndTenant.mockResolvedValue(null);

		await expect(
			handler.execute(
				new DeactivateMembershipCommand('user-id', 'tenant-id', ROLES.ADMIN),
			),
		).rejects.toThrow();

		expect(membershipRepository.save).not.toHaveBeenCalled();
	});

	it('should throw when membership is already inactive', async () => {
		const inactiveMembership = UserTenantMembership.reconstitute({
			id: 'membership-id',
			userId: 'user-id',
			tenantId: 'tenant-id',
			role: ROLES.PRECEPTOR,
			isActive: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		membershipRepository.findByUserAndTenant.mockResolvedValue(
			inactiveMembership,
		);

		await expect(
			handler.execute(
				new DeactivateMembershipCommand('user-id', 'tenant-id', ROLES.ADMIN),
			),
		).rejects.toThrow();

		expect(membershipRepository.save).not.toHaveBeenCalled();
	});
});
