import {
	Body,
	Controller,
	Post,
	Req,
	Res,
	UnauthorizedException,
	UseGuards,
} from '@nestjs/common';
import {
	ApiCookieAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
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
import { LoginResponseDto } from '../../application/dto/login.response.dto';
import { SelectTenantRequestDto } from '../../application/dto/select-tenant.request.dto';

// auth.controller.ts
@Controller('auth')
@ApiTags('Auth')
export class AuthController {
	constructor(
		private readonly loginHandler: LoginHandler,
		private readonly selectTenantHandler: SelectTenantHandler,
		private readonly logoutHandler: LogoutHandler,
		private readonly refreshTokenHandler: RefreshTokenHandler,
	) {}

	@Post('login')
	@ApiOperation({
		summary: 'Iniciar sesión',
		description:
			'Paso 1 del flujo de autenticación. Valida las credenciales (email y password) y devuelve los tenants a los que pertenece el usuario. Es público y no requiere cookie. Además setea la cookie httpOnly pending_user_id (10 minutos) que se consume en POST /auth/select-tenant. Body de ejemplo: { "email": "m.gonzalez@escuela.edu.ar", "password": "contraseñaSegura123" }. La respuesta exitosa se envuelve en { success, data: LoginResponseDto, timeStamp }. Los errores se envuelven en { statusCode, timestamp, path, method, message, error }. Roles permitidos: ninguno (público).',
	})
	@ApiResponse({
		status: 201,
		description:
			'Credenciales válidas. Devuelve isSuperAdmin y la lista de tenants. Cookie pending_user_id seteada.',
		type: LoginResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({
		status: 401,
		description: 'Credenciales inválidas o usuario inactivo',
	})
	async login(
		@Body() dto: LoginRequestDto,
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
	) {
		const result = await this.loginHandler.execute(
			new LoginCommand(dto.email, dto.password),
		);
		// cookie temporal con userId — httpOnly, dura solo 10 minutos
		res.cookie('pending_user_id', result.userId, {
			httpOnly: true,
			// secure: true,
			sameSite: 'strict',
			maxAge: 10 * 60 * 1000,
		});

		return result; // LoginResponseDto: { isSuperAdmin, tenants }
	}

	@Post('select-tenant')
	@ApiOperation({
		summary: 'Seleccionar tenant y obtener sesión',
		description:
			'Paso 2 del flujo de autenticación. Requiere la cookie httpOnly pending_user_id seteada por POST /auth/login; el usuario se obtiene de esa cookie (el campo userId del body no se usa). Selecciona el tenant y setea las cookies httpOnly access_token (15 minutos, path /) y refresh_token (7 días, path /auth/refresh). Body de ejemplo: { "tenantId": "2d4e0f5a-8c1b-4d3e-9a2f-6b8c0d1e2f3a" }. A partir de acá, los endpoints autenticados usan la cookie access_token (documentados con @ApiCookieAuth). La respuesta exitosa se envuelve en { success, data: AuthResponseDto, timeStamp }. Los errores se envuelven en { statusCode, timestamp, path, method, message, error }. Roles permitidos: ninguno (público, requiere cookie pending_user_id).',
	})
	@ApiResponse({
		status: 201,
		description:
			'Sesión iniciada. Cookies access_token y refresh_token seteada. Devuelve el usuario dentro del tenant.',
		type: AuthResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({
		status: 401,
		description:
			'Cookie pending_user_id ausente o expirada, o selección de tenant inválida',
	})
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
			// secure: true,
			sameSite: 'strict',
			maxAge: 15 * 60 * 1000,
			path: '/',
		});

		res.cookie('refresh_token', result.refreshToken, {
			httpOnly: true,
			// secure: true,
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
	@ApiCookieAuth('access_token')
	@ApiOperation({
		summary: 'Cerrar sesión',
		description:
			'Paso final del flujo. Requiere estar autenticado con la cookie access_token y tener la cookie httpOnly refresh_token. Revoca el refresh token en el backend y limpia las cookies access_token y refresh_token. La respuesta no devuelve datos (data es null). URL: POST /auth/logout. Roles permitidos: cualquier usuario autenticado.',
	})
	@ApiResponse({
		status: 200,
		description:
			'Sesión cerrada. Cookies access_token y refresh_token limpiadas. La respuesta no devuelve datos (data es null).',
	})
	@ApiResponse({
		status: 401,
		description: 'No autenticado (cookie access_token o refresh_token ausente)',
	})
	async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
		const refreshToken = req.cookies?.refresh_token;
		if (!refreshToken) throw new UnauthorizedException();

		await this.logoutHandler.execute(new LogoutCommand(refreshToken));

		res.clearCookie('access_token');
		res.clearCookie('refresh_token');
	}

	@Post('refresh')
	@ApiOperation({
		summary: 'Renovar access token',
		description:
			'Renueva el access token usando la cookie httpOnly refresh_token. Es público (sin guard) y setea un nuevo access_token en cookie (15 minutos, path /). La respuesta no devuelve datos (data es null). Roles permitidos: ninguno (público, requiere cookie refresh_token).',
	})
	@ApiResponse({
		status: 200,
		description:
			'Nuevo access_token seteado en cookie. La respuesta no devuelve datos (data es null).',
	})
	@ApiResponse({
		status: 401,
		description: 'Cookie refresh_token ausente, inválida o expirada',
	})
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
