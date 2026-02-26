// get-current-user.handler.spec.ts
import { ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { GetCurrentUserHandler } from '../../../src/modules/identity/application/queries/get-current-user/get-current-user.handler';
import { GetCurrentUserQuery } from '../../../src/modules/identity/application/queries/get-current-user/get-current-user.query';
import { UserTenantMembership } from '../../../src/modules/identity/domain/entities/user-tenant-membership.entity';
import { User } from '../../../src/modules/identity/domain/entities/user.entity';
import { IUserTenantMembershipRepository } from '../../../src/modules/identity/domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../src/modules/identity/domain/repositories/user.repository.interface';

describe('GetCurrentUserHandler', () => {
	let handler: GetCurrentUserHandler;
	let userRepo: MockProxy<IUserRepository>;
	let membershipRepo: MockProxy<IUserTenantMembershipRepository>;

	const mockUser = User.reconstitute({
		id: 'user-id',
		email: 'test@test.com',
		passwordHash: 'hashed',
		firstName: 'John',
		lastName: 'Doe',
		isActive: true,
		mustChangePassword: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

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
		userRepo = mock<IUserRepository>();
		membershipRepo = mock<IUserTenantMembershipRepository>();

		handler = new GetCurrentUserHandler(membershipRepo, userRepo);
	});

	it('should return user with membership data', async () => {
		userRepo.findById.mockResolvedValue(mockUser);
		membershipRepo.findByUserAndTenant.mockResolvedValue(mockMembership);

		const result = await handler.execute(
			new GetCurrentUserQuery('user-id', 'tenant-id'),
		);

		expect(result.id).toBe('user-id');
		expect(result.email).toBe('test@test.com');
		expect(result.role).toBe(ROLES.PRECEPTOR);
		expect(result.tenantId).toBe('tenant-id');
	});

	it('should throw when user does not exist', async () => {
		userRepo.findById.mockResolvedValue(null);

		await expect(
			handler.execute(new GetCurrentUserQuery('user-id', 'tenant-id')),
		).rejects.toThrow();
	});

	it('should throw when membership does not exist', async () => {
		userRepo.findById.mockResolvedValue(mockUser);
		membershipRepo.findByUserAndTenant.mockResolvedValue(null);

		await expect(
			handler.execute(new GetCurrentUserQuery('user-id', 'tenant-id')),
		).rejects.toThrow();
	});
});
