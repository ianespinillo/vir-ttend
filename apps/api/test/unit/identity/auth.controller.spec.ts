// auth.controller.spec.ts
import { UnauthorizedException } from '@nestjs/common';
import { validate } from 'class-validator';
import { Request, Response } from 'express';
import { MockProxy, mock } from 'jest-mock-extended';
import { LoginHandler } from '../../../src/modules/identity/application/commands/login/login.handler';
import { LogoutCommand } from '../../../src/modules/identity/application/commands/logout/logout.command';
import { LogoutHandler } from '../../../src/modules/identity/application/commands/logout/logout.handler';
import { RefreshTokenCommand } from '../../../src/modules/identity/application/commands/refresh-token/refresh-token.command';
import { RefreshTokenHandler } from '../../../src/modules/identity/application/commands/refresh-token/refresh-token.handler';
import { SelectTenantHandler } from '../../../src/modules/identity/application/commands/select-tenant/select-tenant.handler';
import { RefreshTokenRequestDto } from '../../../src/modules/identity/application/dto/refresh-token.request.dto';
import { TokenService } from '../../../src/modules/identity/domain/services/token.service';
import { AuthController } from '../../../src/modules/identity/presentation/controllers/auth.controller';

describe('AuthController (refresh / logout)', () => {
	let controller: AuthController;
	let refreshTokenHandler: MockProxy<RefreshTokenHandler>;
	let logoutHandler: MockProxy<LogoutHandler>;
	let res: MockProxy<Response>;

	const reqWith = (cookies?: Record<string, string>) =>
		({ cookies }) as unknown as Request;
	const bodyWith = (refreshToken?: string) => {
		const dto = new RefreshTokenRequestDto();
		dto.refreshToken = refreshToken;
		return dto;
	};

	beforeEach(() => {
		refreshTokenHandler = mock<RefreshTokenHandler>();
		logoutHandler = mock<LogoutHandler>();
		res = mock<Response>();

		controller = new AuthController(
			mock<LoginHandler>(),
			mock<SelectTenantHandler>(),
			logoutHandler,
			refreshTokenHandler,
			mock<TokenService>(),
		);
	});

	describe('refresh', () => {
		beforeEach(() => {
			refreshTokenHandler.execute.mockImplementation(
				async (command: RefreshTokenCommand) => ({
					accessToken: 'new-access',
					refreshToken: command.refreshToken,
				}),
			);
		});

		it('uses the cookie token, sets the access cookie and returns tokens in the body', async () => {
			const result = await controller.refresh(
				bodyWith(),
				reqWith({ refresh_token: 'cookie-token' }),
				res,
			);

			expect(refreshTokenHandler.execute).toHaveBeenCalledWith(
				new RefreshTokenCommand('cookie-token'),
			);
			expect(res.cookie).toHaveBeenCalledWith(
				'access_token',
				'new-access',
				expect.objectContaining({ httpOnly: true, path: '/' }),
			);
			expect(result).toEqual({
				accessToken: 'new-access',
				refreshToken: 'cookie-token',
			});
		});

		it('falls back to the body token when there is no cookie', async () => {
			const result = await controller.refresh(
				bodyWith('body-token'),
				reqWith(undefined),
				res,
			);

			expect(refreshTokenHandler.execute).toHaveBeenCalledWith(
				new RefreshTokenCommand('body-token'),
			);
			expect(result).toEqual({
				accessToken: 'new-access',
				refreshToken: 'body-token',
			});
		});

		it('prefers the cookie over the body token', async () => {
			await controller.refresh(
				bodyWith('body-token'),
				reqWith({ refresh_token: 'cookie-token' }),
				res,
			);

			expect(refreshTokenHandler.execute).toHaveBeenCalledWith(
				new RefreshTokenCommand('cookie-token'),
			);
		});

		it('throws Unauthorized when neither cookie nor body carry a token', async () => {
			await expect(
				controller.refresh(bodyWith(), reqWith({}), res),
			).rejects.toBeInstanceOf(UnauthorizedException);
			expect(refreshTokenHandler.execute).not.toHaveBeenCalled();
		});

		it('propagates Unauthorized from the handler for revoked or expired tokens', async () => {
			refreshTokenHandler.execute.mockRejectedValue(
				new UnauthorizedException('Invalid token'),
			);

			await expect(
				controller.refresh(bodyWith('revoked'), reqWith(undefined), res),
			).rejects.toBeInstanceOf(UnauthorizedException);
			expect(res.cookie).not.toHaveBeenCalled();
		});
	});

	describe('logout', () => {
		it('revokes the cookie token and clears the session cookies', async () => {
			await controller.logout(
				bodyWith(),
				reqWith({ refresh_token: 'cookie-token' }),
				res,
			);

			expect(logoutHandler.execute).toHaveBeenCalledWith(
				new LogoutCommand('cookie-token'),
			);
			expect(res.clearCookie).toHaveBeenCalledWith('access_token');
			expect(res.clearCookie).toHaveBeenCalledWith('refresh_token');
		});

		it('revokes the body token when there is no cookie', async () => {
			await controller.logout(bodyWith('body-token'), reqWith(undefined), res);

			expect(logoutHandler.execute).toHaveBeenCalledWith(
				new LogoutCommand('body-token'),
			);
		});

		it('throws Unauthorized when neither cookie nor body carry a token', async () => {
			await expect(
				controller.logout(bodyWith(), reqWith({}), res),
			).rejects.toBeInstanceOf(UnauthorizedException);
			expect(logoutHandler.execute).not.toHaveBeenCalled();
		});
	});

	describe('RefreshTokenRequestDto', () => {
		it('accepts an empty body (web clients using the cookie)', async () => {
			expect(await validate(new RefreshTokenRequestDto())).toHaveLength(0);
		});

		it('accepts a non-empty string token', async () => {
			expect(await validate(bodyWith('abc'))).toHaveLength(0);
		});

		it('rejects an empty string token', async () => {
			expect(await validate(bodyWith(''))).not.toHaveLength(0);
		});

		it('rejects a non-string token', async () => {
			const dto = new RefreshTokenRequestDto();
			(dto as unknown as { refreshToken: unknown }).refreshToken = 123;
			expect(await validate(dto)).not.toHaveLength(0);
		});
	});
});
