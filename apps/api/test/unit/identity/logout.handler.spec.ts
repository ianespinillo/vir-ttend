// logout.handler.spec.ts
import { MockProxy, mock } from 'jest-mock-extended';
import { LogoutCommand } from '../../../src/modules/identity/application/commands/logout/logout.command';
import { LogoutHandler } from '../../../src/modules/identity/application/commands/logout/logout.handler';
import { RefreshToken } from '../../../src/modules/identity/domain/entities/refresh-token.entity';
import { IRefreshTokenRepository } from '../../../src/modules/identity/domain/repositories/refresh-token.repository.interface';
import { TokenService } from '../../../src/modules/identity/domain/services/token.service';

describe('LogoutHandler', () => {
	let handler: LogoutHandler;
	let refreshTokenRepo: MockProxy<IRefreshTokenRepository>;
	let tokenService: MockProxy<TokenService>;

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
		tokenService = mock<TokenService>();

		handler = new LogoutHandler(refreshTokenRepo, tokenService);
	});

	it('should revoke refresh token', async () => {
		tokenService.hashToken.mockReturnValue('hashed-token');
		refreshTokenRepo.findByHash.mockResolvedValue(mockRefreshToken);

		await handler.execute(new LogoutCommand('raw-token'));

		expect(refreshTokenRepo.save).toHaveBeenCalledTimes(1);
		const savedToken = refreshTokenRepo.save.mock.calls[0][0];
		expect(savedToken.isRevoked()).toBe(true);
	});

	it('should throw when token does not exist', async () => {
		tokenService.hashToken.mockReturnValue('hashed-token');
		refreshTokenRepo.findByHash.mockResolvedValue(null);

		await expect(handler.execute(new LogoutCommand('raw-token'))).rejects.toThrow(
			'Invalid refresh token',
		);
	});
});
