// select-tenant.handler.spec.ts
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { SelectTenantCommand } from '../../../src/modules/identity/application/commands/select-tenant/select-tenant.command';
import { SelectTenantHandler } from '../../../src/modules/identity/application/commands/select-tenant/select-tenant.handler';
import { UserTenantMembership } from '../../../src/modules/identity/domain/entities/user-tenant-membership.entity';
import { User } from '../../../src/modules/identity/domain/entities/user.entity';
import { UserLoggedInEvent } from '../../../src/modules/identity/domain/events/user-logged-in.event';
import { IRefreshTokenRepository } from '../../../src/modules/identity/domain/repositories/refresh-token.repository.interface';
import { IUserTenantMembershipRepository } from '../../../src/modules/identity/domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../src/modules/identity/domain/repositories/user.repository.interface';
import { TokenService } from '../../../src/modules/identity/domain/services/token.service';

describe('SelectTenantHandler', () => {
	let handler: SelectTenantHandler;
	let userRepo: MockProxy<IUserRepository>;
	let membershipRepo: MockProxy<IUserTenantMembershipRepository>;
	let refreshTokenRepo: MockProxy<IRefreshTokenRepository>;
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
		refreshTokenRepo = mock<IRefreshTokenRepository>();
		tokenService = mock<TokenService>();
		eventEmitter = mock<EventEmitter2>();

		handler = new SelectTenantHandler(
			userRepo,
			membershipRepo,
			refreshTokenRepo,
			tokenService,
			eventEmitter,
		);
	});

	it('should generate tokens when membership is valid', async () => {
		membershipRepo.findByUserAndTenant.mockResolvedValue(mockMembership);
		userRepo.findById.mockResolvedValue(mockUser);
		tokenService.generateAccessToken.mockReturnValue('access-token');
		tokenService.generateRefreshToken.mockReturnValue('refresh-token');
		tokenService.hashToken.mockReturnValue('hashed-refresh-token');

		const result = await handler.execute(
			new SelectTenantCommand(
				'user-id',
				'tenant-id',
				'user-agent',
				'192.168.22.5',
			),
		);

		expect(result.accessToken).toBe('access-token');
		expect(result.refreshToken).toBe('refresh-token');
		expect(refreshTokenRepo.save).toHaveBeenCalledTimes(1);
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			'user.logged-in',
			expect.any(UserLoggedInEvent),
		);
	});

	it('should throw when membership does not exist', async () => {
		membershipRepo.findByUserAndTenant.mockResolvedValue(null);

		await expect(
			handler.execute(
				new SelectTenantCommand(
					'user-id',
					'tenant-id',
					'user-agent',
					'192.168.22.5',
				),
			),
		).rejects.toThrow('Invalid tenant selection');
	});

	it('should throw when membership is inactive', async () => {
		const inactiveMembership = UserTenantMembership.reconstitute({
			...mockMembership,
			id: 'membership-id',
			userId: 'user-id',
			tenantId: 'tenant-id',
			role: ROLES.PRECEPTOR,
			isActive: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		membershipRepo.findByUserAndTenant.mockResolvedValue(inactiveMembership);

		await expect(
			handler.execute(
				new SelectTenantCommand(
					'user-id',
					'tenant-id',
					'user-agent',
					'192.168.22.5',
				),
			),
		).rejects.toThrow('Invalid tenant selection');
	});

	it('should generate access token with correct payload', async () => {
		membershipRepo.findByUserAndTenant.mockResolvedValue(mockMembership);
		userRepo.findById.mockResolvedValue(mockUser);
		tokenService.generateAccessToken.mockReturnValue('access-token');
		tokenService.generateRefreshToken.mockReturnValue('refresh-token');
		tokenService.hashToken.mockReturnValue('hashed-refresh-token');

		await handler.execute(
			new SelectTenantCommand(
				'user-id',
				'tenant-id',
				'user-agent',
				'192.168.22.5',
			),
		);

		expect(tokenService.generateAccessToken).toHaveBeenCalledWith({
			sub: 'user-id',
			email: 'test@test.com',
			tenantId: 'tenant-id',
			role: ROLES.PRECEPTOR,
		});
	});
});
