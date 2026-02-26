// refresh-token.handler.spec.ts
import { ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { RefreshTokenCommand } from '../../../src/modules/identity/application/commands/refresh-token/refresh-token.command';
import { RefreshTokenHandler } from '../../../src/modules/identity/application/commands/refresh-token/refresh-token.handler';
import { RefreshToken } from '../../../src/modules/identity/domain/entities/refresh-token.entity';
import { UserTenantMembership } from '../../../src/modules/identity/domain/entities/user-tenant-membership.entity';
import { User } from '../../../src/modules/identity/domain/entities/user.entity';
import { IRefreshTokenRepository } from '../../../src/modules/identity/domain/repositories/refresh-token.repository.interface';
import { IUserTenantMembershipRepository } from '../../../src/modules/identity/domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../src/modules/identity/domain/repositories/user.repository.interface';
import { TokenService } from '../../../src/modules/identity/domain/services/token.service';

describe('RefreshTokenHandler', () => {
	let handler: RefreshTokenHandler;
	let refreshTokenRepo: MockProxy<IRefreshTokenRepository>;
	let userRepo: MockProxy<IUserRepository>;
	let membershipRepo: MockProxy<IUserTenantMembershipRepository>;
	let tokenService: MockProxy<TokenService>;

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

	const mockRefreshToken = RefreshToken.reconstitute({
		id: 'token-id',
		userId: 'user-id',
		tenantId: 'tenant-id',
		token: 'hashed-token',
		expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		createdAt: new Date(),
		revokedAt: undefined,
	});

	beforeEach(() => {
		refreshTokenRepo = mock<IRefreshTokenRepository>();
		userRepo = mock<IUserRepository>();
		membershipRepo = mock<IUserTenantMembershipRepository>();
		tokenService = mock<TokenService>();

		handler = new RefreshTokenHandler(
			refreshTokenRepo,
			membershipRepo,
			userRepo,
			tokenService,
		);
	});

	it('should return new access token when refresh token is valid', async () => {
		tokenService.hashToken.mockReturnValue('hashed-token');
		refreshTokenRepo.findByHash.mockResolvedValue(mockRefreshToken);
		userRepo.findById.mockResolvedValue(mockUser);
		membershipRepo.findByUserAndTenant.mockResolvedValue(mockMembership);
		tokenService.generateAccessToken.mockReturnValue('new-access-token');

		const result = await handler.execute(new RefreshTokenCommand('raw-token'));

		expect(result.accessToken).toBe('new-access-token');
		expect(result.refreshToken).toBe('raw-token');
	});

	it('should throw when token does not exist', async () => {
		tokenService.hashToken.mockReturnValue('hashed-token');
		refreshTokenRepo.findByHash.mockResolvedValue(null);

		await expect(
			handler.execute(new RefreshTokenCommand('raw-token')),
		).rejects.toThrow('Invalid token');
	});

	it('should throw when token is revoked', async () => {
		const revokedToken = RefreshToken.reconstitute({
			id: 'token-id',
			userId: 'user-id',
			tenantId: 'tenant-id',
			token: 'hashed-token',
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			createdAt: new Date(),
			revokedAt: new Date(),
		});
		tokenService.hashToken.mockReturnValue('hashed-token');
		refreshTokenRepo.findByHash.mockResolvedValue(revokedToken);

		await expect(
			handler.execute(new RefreshTokenCommand('raw-token')),
		).rejects.toThrow('Invalid token');
	});

	it('should throw when token is expired', async () => {
		const expiredToken = RefreshToken.reconstitute({
			id: 'token-id',
			userId: 'user-id',
			tenantId: 'tenant-id',
			token: 'hashed-token',
			expiresAt: new Date(Date.now() - 1000),
			createdAt: new Date(),
			revokedAt: undefined,
		});
		tokenService.hashToken.mockReturnValue('hashed-token');
		refreshTokenRepo.findByHash.mockResolvedValue(expiredToken);

		await expect(
			handler.execute(new RefreshTokenCommand('raw-token')),
		).rejects.toThrow('Invalid token');
	});

	it('should throw when membership is inactive', async () => {
		tokenService.hashToken.mockReturnValue('hashed-token');
		refreshTokenRepo.findByHash.mockResolvedValue(mockRefreshToken);
		userRepo.findById.mockResolvedValue(mockUser);
		membershipRepo.findByUserAndTenant.mockResolvedValue(
			UserTenantMembership.reconstitute({
				id: 'membership-id',
				userId: 'user-id',
				tenantId: 'tenant-id',
				role: ROLES.PRECEPTOR,
				isActive: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		);

		await expect(
			handler.execute(new RefreshTokenCommand('raw-token')),
		).rejects.toThrow('User not active in tenant');
	});
});
