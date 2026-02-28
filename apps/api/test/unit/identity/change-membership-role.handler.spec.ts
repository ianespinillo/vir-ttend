// change-membership-role.handler.spec.ts
import { ROLES } from '@repo/common';
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
			),
		);

		expect(membershipRepository.save).toHaveBeenCalledTimes(1);
		const saved = membershipRepository.save.mock.calls[0][0];
		expect(saved.role).toBe(ROLES.TEACHER);
	});

	it('should throw when actor lacks permission', async () => {
		await expect(
			handler.execute(
				new ChangeMembershipRoleCommand(
					'user-id',
					'tenant-id',
					ROLES.TEACHER,
					ROLES.PRECEPTOR,
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
				),
			),
		).rejects.toThrow();

		expect(membershipRepository.save).not.toHaveBeenCalled();
	});
});
