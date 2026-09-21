// login.handler.spec.ts
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { LoginCommand } from '../../../src/modules/identity/application/commands/login/login.command';
import { LoginHandler } from '../../../src/modules/identity/application/commands/login/login.handler';
import { Tenant } from '../../../src/modules/identity/domain/entities/tenant.entity';
import { UserTenantMembership } from '../../../src/modules/identity/domain/entities/user-tenant-membership.entity';
import { User } from '../../../src/modules/identity/domain/entities/user.entity';
import { ITenantRepository } from '../../../src/modules/identity/domain/repositories/tenant.repository.interface';
import { IUserTenantMembershipRepository } from '../../../src/modules/identity/domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../src/modules/identity/domain/repositories/user.repository.interface';
import { PasswordService } from '../../../src/modules/identity/domain/services/password.service';

describe('LoginHandler', () => {
	let handler: LoginHandler;
	let userRepo: MockProxy<IUserRepository>;
	let membershipRepo: MockProxy<IUserTenantMembershipRepository>;
	let passwordService: MockProxy<PasswordService>;
	let tenantRepo: MockProxy<ITenantRepository>;
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

	const mockTenant = Tenant.reconstitute({
		id: 'tenant-id',
		name: 'Escuela Técnica N°1',
		isActive: true,
		contactEmail: 'contacto@escuela.edu.ar',
		subdomain: 'escuela-1',
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	beforeEach(() => {
		userRepo = mock<IUserRepository>();
		membershipRepo = mock<IUserTenantMembershipRepository>();
		passwordService = mock<PasswordService>();
		tenantRepo = mock<ITenantRepository>();

		handler = new LoginHandler(
			userRepo,
			membershipRepo,
			passwordService,
			tenantRepo,
		);
	});

	it('should return tenants when credentials are valid', async () => {
		userRepo.findByEmail.mockResolvedValue(mockUser);
		passwordService.compare.mockResolvedValue(true);
		membershipRepo.findByUserId.mockResolvedValue([mockMembership]);
		tenantRepo.findById.mockResolvedValue(mockTenant);

		const result = await handler.execute(
			new LoginCommand('test@test.com', 'ValidPass1!'),
		);

		expect(result.isSuperAdmin).toBe(false);
		expect(result.userId).toBe('user-id');
		expect(result.tenants).toHaveLength(1);
		expect(result.tenants[0].tenantId).toBe('tenant-id');
		expect(result.tenants[0].tenantName).toBe('Escuela Técnica N°1');
		expect(result.tenants[0].role).toBe(ROLES.PRECEPTOR);
		expect(result).not.toHaveProperty('token');
	});

	it('should return isSuperAdmin true when user has no memberships', async () => {
		userRepo.findByEmail.mockResolvedValue(mockUser);
		passwordService.compare.mockResolvedValue(true);
		membershipRepo.findByUserId.mockResolvedValue([]);
		tenantRepo.list.mockResolvedValue([mockTenant]);

		const result = await handler.execute(
			new LoginCommand('test@test.com', 'ValidPass1!'),
		);

		expect(result.isSuperAdmin).toBe(true);
		expect(result.userId).toBe('user-id');
		expect(result.tenants).toHaveLength(1);
		expect(result.tenants[0].tenantId).toBe('tenant-id');
		expect(result.tenants[0].tenantName).toBe('Escuela Técnica N°1');
		expect(result.tenants[0].role).toBe(ROLES.SUPERADMIN);
		expect(result).not.toHaveProperty('token');
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
