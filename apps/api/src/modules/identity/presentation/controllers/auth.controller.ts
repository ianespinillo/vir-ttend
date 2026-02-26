import {
	Body,
	Controller,
	Post,
	Req,
	Res,
	UnauthorizedException,
	UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../../../../common/guard/jwt-auth.guard';
import { LoginCommand } from '../../application/commands/login/login.command';
import { LoginHandler } from '../../application/commands/login/login.handler';
import { LogoutCommand } from '../../application/commands/logout/logout.command';
import { LogoutHandler } from '../../application/commands/logout/logout.handler';
import { RefreshTokenCommand } from '../../application/commands/refresh-token/refresh-token.command';
import { RefreshTokenHandler } from '../../application/commands/refresh-token/refresh-token.handler';
import { SelectTenantCommand } from '../../application/commands/select-tenant/select-tenant.command';
import { SelectTenantHandler } from '../../application/commands/select-tenant/select-tenant.handler';
import { AuthResponseDto } from '../../application/dto/auth.response.dto';
import { LoginRequestDto } from '../../application/dto/login.request.dto';
import { SelectTenantRequestDto } from '../../application/dto/select-tenant.request.dto';

// auth.controller.ts
@Controller('auth')
export class AuthController {
	constructor(
		private readonly loginHandler: LoginHandler,
		private readonly selectTenantHandler: SelectTenantHandler,
		private readonly logoutHandler: LogoutHandler,
		private readonly refreshTokenHandler: RefreshTokenHandler,
	) {}

	@Post('login')
	async login(
		@Body() dto: LoginRequestDto,
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
	) {
		const result = await this.loginHandler.execute(
			new LoginCommand(dto.email, dto.password),
		);

		// cookie temporal con userId — httpOnly, dura solo 10 minutos
		res.cookie('pending_user_id', result.sub, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 10 * 60 * 1000,
		});

		return result; // LoginResponseDto: { isSuperAdmin, tenants }
	}

	@Post('select-tenant')
	async selectTenant(
		@Body() dto: SelectTenantRequestDto, // solo tenantId
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
	) {
		const userId = req.cookies?.pending_user_id;
		if (!userId) throw new UnauthorizedException();

		const result = await this.selectTenantHandler.execute(
			new SelectTenantCommand(
				userId,
				dto.tenantId,
				req.cookies['user-agent'] ?? '',
				req.ip ?? '',
			),
		);

		res.cookie('access_token', result.accessToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 15 * 60 * 1000,
			path: '/',
		});

		res.cookie('refresh_token', result.refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 7 * 24 * 60 * 60 * 1000,
			path: '/auth/refresh',
		});

		// limpiar cookie temporal
		res.clearCookie('pending_user_id');

		return new AuthResponseDto(result.user);
	}

	@Post('logout')
	@UseGuards(JwtAuthGuard)
	async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
		const refreshToken = req.cookies?.refresh_token;
		if (!refreshToken) throw new UnauthorizedException();

		await this.logoutHandler.execute(new LogoutCommand(refreshToken));

		res.clearCookie('access_token');
		res.clearCookie('refresh_token');
	}

	@Post('refresh')
	async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
		const refreshToken = req.cookies?.refresh_token;
		if (!refreshToken) throw new UnauthorizedException();

		const result = await this.refreshTokenHandler.execute(
			new RefreshTokenCommand(refreshToken),
		);

		res.cookie('access_token', result.accessToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 15 * 60 * 1000,
			path: '/',
		});
	}
}
