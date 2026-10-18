import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
// deactivate-membership.handler.spec.ts
import {
	ConflictError,
	ForbiddenError,
	NotFoundError,
} from '../../../src/common/errors';
import { DeactivateMembershipCommand } from '../../../src/modules/identity/application/commands/deactivate-membership/deactivate-membership.command';
import { DeactivateMembershipHandler } from '../../../src/modules/identity/application/commands/deactivate-membership/deactivate-membership.handler';
import { UserTenantMembership } from '../../../src/modules/identity/domain/entities/user-tenant-membership.entity';
import { User } from '../../../src/modules/identity/domain/entities/user.entity';
import { IUserTenantMembershipRepository } from '../../../src/modules/identity/domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../src/modules/identity/domain/repositories/user.repository.interface';

describe('DeactivateMembershipHandler', () => {
	let handler: DeactivateMembershipHandler;
	let membershipRepository: MockProxy<IUserTenantMembershipRepository>;
	let userRepository: MockProxy<IUserRepository>;

	const mockMembership = UserTenantMembership.reconstitute({
		id: 'membership-id',
		userId: 'user-id',
		tenantId: 'tenant-id',
		role: ROLES.PRECEPTOR,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	const mockUser = User.reconstitute({
		id: 'user-id',
		email: 'member@tenant.com',
		passwordHash: 'hashed',
		firstName: 'John',
		lastName: 'Doe',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		mustChangePassword: false,
	});

	beforeEach(() => {
		membershipRepository = mock<IUserTenantMembershipRepository>();
		userRepository = mock<IUserRepository>();
		handler = new DeactivateMembershipHandler(
			userRepository,
			membershipRepository,
		);
	});

	it('should deactivate membership when actor has permission', async () => {
		membershipRepository.findByUserAndTenant.mockResolvedValue(mockMembership);

		await handler.execute(
			new DeactivateMembershipCommand(
				'user-id',
				'tenant-id',
				ROLES.ADMIN,
				'actor-id',
			),
		);

		expect(membershipRepository.save).toHaveBeenCalledTimes(1);
		const saved = membershipRepository.save.mock.calls[0][0];
		expect(saved.isActive).toBe(false);
	});

	describe('single-tenant admin protections', () => {
		const originalEnv = { ...process.env };

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
				new DeactivateMembershipCommand(
					'admin-2',
					'tenant-id',
					ROLES.ADMIN,
					actorUserId,
				),
			);

		beforeEach(() => {
			process.env.TENANCY_MODE = 'single';
			process.env.TENANT_ID = 'tenant-id';
			process.env.TENANT_SLUG = 'school';
			membershipRepository.findByUserAndTenant.mockResolvedValue(
				adminMembership(),
			);
			membershipRepository.findByUserId.mockResolvedValue([adminMembership()]);
		});

		afterEach(() => {
			process.env = { ...originalEnv };
		});

		it('deactivates another admin when at least two admins are active', async () => {
			membershipRepository.countActiveByTenantAndRole.mockResolvedValue(2);

			await deactivate('actor-id');

			expect(membershipRepository.save).toHaveBeenCalled();
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

	it('should throw when actor lacks permission', async () => {
		membershipRepository.findByUserAndTenant.mockResolvedValue(mockMembership);

		await expect(
			handler.execute(
				new DeactivateMembershipCommand(
					'user-id',
					'tenant-id',
					ROLES.PRECEPTOR,
					'actor-id',
				),
			),
		).rejects.toStrictEqual(
			new ForbiddenError('No tiene permiso para gestionar a este usuario.'),
		);

		expect(membershipRepository.save).not.toHaveBeenCalled();
	});

	it('should throw when membership does not exist', async () => {
		membershipRepository.findByUserAndTenant.mockResolvedValue(null);

		await expect(
			handler.execute(
				new DeactivateMembershipCommand(
					'user-id',
					'tenant-id',
					ROLES.ADMIN,
					'actor-id',
				),
			),
		).rejects.toStrictEqual(
			new NotFoundError('El usuario no pertenece a esta institución.'),
		);

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
				new DeactivateMembershipCommand(
					'user-id',
					'tenant-id',
					ROLES.ADMIN,
					'actor-id',
				),
			),
		).rejects.toStrictEqual(
			new ConflictError('El usuario ya está desactivado en esta institución.'),
		);

		expect(membershipRepository.save).not.toHaveBeenCalled();
	});

	it('should resolve userId by email and deactivate membership', async () => {
		const activeMembership = UserTenantMembership.reconstitute({
			id: 'membership-id',
			userId: 'user-id',
			tenantId: 'tenant-id',
			role: ROLES.PRECEPTOR,
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		userRepository.findByEmail.mockResolvedValue(mockUser);
		membershipRepository.findByUserAndTenant.mockResolvedValue(activeMembership);

		await handler.execute(
			new DeactivateMembershipCommand(
				'',
				'tenant-id',
				ROLES.ADMIN,
				'actor-id',
				'member@tenant.com',
			),
		);

		expect(userRepository.findByEmail).toHaveBeenCalledWith('member@tenant.com');
		expect(membershipRepository.findByUserAndTenant).toHaveBeenCalledWith(
			'user-id',
			'tenant-id',
		);
		expect(membershipRepository.save).toHaveBeenCalledTimes(1);
		const saved = membershipRepository.save.mock.calls[0][0];
		expect(saved.isActive).toBe(false);
	});

	it('should throw NotFoundError when email has no matching user', async () => {
		userRepository.findByEmail.mockResolvedValue(null);

		await expect(
			handler.execute(
				new DeactivateMembershipCommand(
					'',
					'tenant-id',
					ROLES.ADMIN,
					'actor-id',
					'unknown@tenant.com',
				),
			),
		).rejects.toStrictEqual(
			new NotFoundError('No existe un usuario con el correo unknown@tenant.com.'),
		);

		expect(membershipRepository.findByUserAndTenant).not.toHaveBeenCalled();
		expect(membershipRepository.save).not.toHaveBeenCalled();
	});
});
