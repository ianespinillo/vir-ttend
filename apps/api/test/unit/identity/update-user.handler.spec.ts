// update-user.handler.spec.ts
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { UpdateUserCommand } from '../../../src/modules/identity/application/commands/update-user/update-user.command';
import { UpdateUserHandler } from '../../../src/modules/identity/application/commands/update-user/update-user.handler';
import { UserTenantMembership } from '../../../src/modules/identity/domain/entities/user-tenant-membership.entity';
import { User } from '../../../src/modules/identity/domain/entities/user.entity';
import { IUserTenantMembershipRepository } from '../../../src/modules/identity/domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../src/modules/identity/domain/repositories/user.repository.interface';
import { Email } from '../../../src/modules/identity/domain/value-objects/email.vo';

describe('UpdateUserHandler', () => {
	let handler: UpdateUserHandler;
	let userRepo: MockProxy<IUserRepository>;
	let memberRepo: MockProxy<IUserTenantMembershipRepository>;

	const mockUser = User.reconstitute({
		id: 'user-id',
		email: 'original@test.com',
		passwordHash: 'hashed',
		firstName: 'John',
		lastName: 'Doe',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		mustChangePassword: false,
	});

	const mockMembership = UserTenantMembership.reconstitute({
		id: 'membership-id',
		userId: 'user-id',
		tenantId: 'tenant-id',
		role: ROLES.ADMIN,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	beforeEach(() => {
		userRepo = mock<IUserRepository>();
		memberRepo = mock<IUserTenantMembershipRepository>();
		handler = new UpdateUserHandler(userRepo, memberRepo);
	});

	it('should throw BadRequestException when email is already used by another user', async () => {
		userRepo.findById.mockResolvedValue(mockUser);
		const otherUser = User.reconstitute({
			id: 'other-user-id',
			email: 'taken@test.com',
			passwordHash: 'hashed',
			firstName: 'Jane',
			lastName: 'Roe',
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			mustChangePassword: false,
		});
		userRepo.findByEmail.mockResolvedValue(otherUser);
		memberRepo.findByUserAndTenant.mockResolvedValue(mockMembership);

		await expect(
			handler.execute(
				new UpdateUserCommand('user-id', 'tenant-id', {
					email: new Email('taken@test.com'),
				}),
			),
		).rejects.toThrow(new BadRequestException('Email already in use'));

		expect(userRepo.save).not.toHaveBeenCalled();
	});

	it('should throw NotFoundException when target user has no membership in tenant', async () => {
		userRepo.findById.mockResolvedValue(mockUser);
		userRepo.findByEmail.mockResolvedValue(null);
		memberRepo.findByUserAndTenant.mockResolvedValue(null);

		await expect(
			handler.execute(
				new UpdateUserCommand('user-id', 'other-tenant-id', { firstName: 'New' }),
			),
		).rejects.toThrow(new NotFoundException('User not found in this tenant'));

		expect(userRepo.save).not.toHaveBeenCalled();
	});

	it('should update provided props and save the user', async () => {
		userRepo.findById.mockResolvedValue(mockUser);
		userRepo.findByEmail.mockResolvedValue(null);
		memberRepo.findByUserAndTenant.mockResolvedValue(mockMembership);

		await handler.execute(
			new UpdateUserCommand('user-id', 'tenant-id', {
				firstName: 'NewFirstName',
				lastName: 'NewLastName',
				email: new Email('new@test.com'),
			}),
		);

		expect(userRepo.findByEmail).toHaveBeenCalledWith('new@test.com');
		expect(memberRepo.findByUserAndTenant).toHaveBeenCalledWith(
			'user-id',
			'tenant-id',
		);
		expect(userRepo.save).toHaveBeenCalledTimes(1);
		const saved = userRepo.save.mock.calls[0][0];
		expect(saved.firstName).toBe('NewFirstName');
		expect(saved.lastName).toBe('NewLastName');
		expect(saved.email).toBe('new@test.com');
	});

	it('should only update provided props (optional fields omitted)', async () => {
		const freshUser = User.reconstitute({
			id: 'user-id',
			email: 'original@test.com',
			passwordHash: 'hashed',
			firstName: 'John',
			lastName: 'Doe',
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			mustChangePassword: false,
		});
		userRepo.findById.mockResolvedValue(freshUser);
		memberRepo.findByUserAndTenant.mockResolvedValue(mockMembership);

		await handler.execute(
			new UpdateUserCommand('user-id', 'tenant-id', {
				firstName: 'OnlyFirst',
			}),
		);

		expect(userRepo.save).toHaveBeenCalledTimes(1);
		const saved = userRepo.save.mock.calls[0][0];
		expect(saved.firstName).toBe('OnlyFirst');
		expect(saved.lastName).toBe('Doe');
		expect(saved.email).toBe('original@test.com');
	});
});
