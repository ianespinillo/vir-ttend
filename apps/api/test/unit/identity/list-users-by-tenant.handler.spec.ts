// list-users-by-tenant.handler.spec.ts
import { ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { ListUsersByTenantHandler } from '../../../src/modules/identity/application/queries/list-users-by-tenant/list-users-by-tenant.handler';
import { ListUsersByTenantQuery } from '../../../src/modules/identity/application/queries/list-users-by-tenant/list-users-by-tenant.query';
import { UserTenantMembership } from '../../../src/modules/identity/domain/entities/user-tenant-membership.entity';
import { User } from '../../../src/modules/identity/domain/entities/user.entity';
import { IUserTenantMembershipRepository } from '../../../src/modules/identity/domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../src/modules/identity/domain/repositories/user.repository.interface';

describe('ListUsersByTenantHandler', () => {
	let handler: ListUsersByTenantHandler;
	let userRepository: MockProxy<IUserRepository>;
	let membershipRepository: MockProxy<IUserTenantMembershipRepository>;

	const mockMemberships = [
		UserTenantMembership.reconstitute({
			id: 'membership-1',
			userId: 'user-1',
			tenantId: 'tenant-id',
			role: ROLES.PRECEPTOR,
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		}),
		UserTenantMembership.reconstitute({
			id: 'membership-2',
			userId: 'user-2',
			tenantId: 'tenant-id',
			role: ROLES.TEACHER,
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		}),
	];

	const mockUsers = [
		User.reconstitute({
			id: 'user-1',
			email: 'preceptor@test.com',
			passwordHash: 'hashed',
			firstName: 'Ana',
			lastName: 'Garcia',
			isActive: true,
			mustChangePassword: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		}),
		User.reconstitute({
			id: 'user-2',
			email: 'teacher@test.com',
			passwordHash: 'hashed',
			firstName: 'Juan',
			lastName: 'Lopez',
			isActive: true,
			mustChangePassword: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		}),
	];

	beforeEach(() => {
		userRepository = mock<IUserRepository>();
		membershipRepository = mock<IUserTenantMembershipRepository>();

		handler = new ListUsersByTenantHandler(membershipRepository, userRepository);
	});

	it('should return hydrated users with membership data', async () => {
		membershipRepository.findByTenant.mockResolvedValue({
			items: mockMemberships,
			total: 2,
		});
		userRepository.findById
			.mockResolvedValueOnce(mockUsers[0])
			.mockResolvedValueOnce(mockUsers[1]);

		const result = await handler.execute(
			new ListUsersByTenantQuery('tenant-id', 1, 20, undefined),
		);

		expect(result.total).toBe(2);
		expect(result.items).toHaveLength(2);
		expect(result.items[0].email).toBe('preceptor@test.com');
		expect(result.items[0].role).toBe(ROLES.PRECEPTOR);
		expect(result.items[1].email).toBe('teacher@test.com');
		expect(result.items[1].role).toBe(ROLES.TEACHER);
	});

	it('should filter by role when provided', async () => {
		membershipRepository.findByTenant.mockResolvedValue({
			items: [mockMemberships[0]],
			total: 1,
		});
		userRepository.findById.mockResolvedValueOnce(mockUsers[0]);

		const result = await handler.execute(
			new ListUsersByTenantQuery('tenant-id', 1, 20, ROLES.PRECEPTOR),
		);

		expect(membershipRepository.findByTenant).toHaveBeenCalledWith(
			'tenant-id',
			expect.objectContaining({ role: ROLES.PRECEPTOR }),
		);
		expect(result.total).toBe(1);
	});

	it('should return empty list when tenant has no users', async () => {
		membershipRepository.findByTenant.mockResolvedValue({
			items: [],
			total: 0,
		});

		const result = await handler.execute(
			new ListUsersByTenantQuery('tenant-id', 1, 20, undefined),
		);

		expect(result.items).toHaveLength(0);
		expect(result.total).toBe(0);
		expect(userRepository.findById).not.toHaveBeenCalled();
	});
});
