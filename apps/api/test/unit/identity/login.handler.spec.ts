// login.handler.spec.ts
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { LoginCommand } from '../../../src/modules/identity/application/commands/login/login.command';
import { LoginHandler } from '../../../src/modules/identity/application/commands/login/login.handler';
import { UserTenantMembership } from '../../../src/modules/identity/domain/entities/user-tenant-membership.entity';
import { User } from '../../../src/modules/identity/domain/entities/user.entity';
import { IUserTenantMembershipRepository } from '../../../src/modules/identity/domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../src/modules/identity/domain/repositories/user.repository.interface';
import { PasswordService } from '../../../src/modules/identity/domain/services/password.service';
import { TokenService } from '../../../src/modules/identity/domain/services/token.service';

describe('LoginHandler', () => {
	let handler: LoginHandler;
	let userRepo: MockProxy<IUserRepository>;
	let membershipRepo: MockProxy<IUserTenantMembershipRepository>;
	let passwordService: MockProxy<PasswordService>;
	let tokenService: MockProxy<TokenService>;
	let eventEmitter: MockProxy<EventEmitter2>;

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
		passwordService = mock<PasswordService>();
		tokenService = mock<TokenService>();

		handler = new LoginHandler(userRepo, membershipRepo, passwordService);
	});

	it('should return tenants when credentials are valid', async () => {
		userRepo.findByEmail.mockResolvedValue(mockUser);
		passwordService.compare.mockResolvedValue(true);
		membershipRepo.findByUserId.mockResolvedValue([mockMembership]);

		const result = await handler.execute(
			new LoginCommand('test@test.com', 'ValidPass1!'),
		);

		expect(result.isSuperAdmin).toBe(false);
		expect(result.sub).toBe('user-id');
		expect(result.tenants).toHaveLength(1);
		expect(result.tenants[0].tenantId).toBe('tenant-id');
	});

	it('should return isSuperAdmin true when user has no memberships', async () => {
		userRepo.findByEmail.mockResolvedValue(mockUser);
		passwordService.compare.mockResolvedValue(true);
		membershipRepo.findByUserId.mockResolvedValue([]);

		const result = await handler.execute(
			new LoginCommand('test@test.com', 'ValidPass1!'),
		);

		expect(result.isSuperAdmin).toBe(true);
		expect(result.tenants).toHaveLength(0);
	});

	it('should throw when user does not exist', async () => {
		userRepo.findByEmail.mockResolvedValue(null);

		await expect(
			handler.execute(new LoginCommand('noexiste@test.com', 'ValidPass1!')),
		).rejects.toThrow('Invalid credentials');
	});

	it('should throw when password is incorrect', async () => {
		userRepo.findByEmail.mockResolvedValue(mockUser);
		passwordService.compare.mockResolvedValue(false);

		await expect(
			handler.execute(new LoginCommand('test@test.com', 'WrongPass1!')),
		).rejects.toThrow('Invalid credentials');
	});

	it('should throw when user is inactive', async () => {
		const inactiveUser = User.reconstitute({
			...mockUser,
			id: 'user-id',
			email: 'test@test.com',
			passwordHash: 'hashed',
			firstName: 'John',
			lastName: 'Doe',
			isActive: false,
			mustChangePassword: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		userRepo.findByEmail.mockResolvedValue(inactiveUser);

		await expect(
			handler.execute(new LoginCommand('test@test.com', 'ValidPass1!')),
		).rejects.toThrow('User not active');
	});
});
