import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Put,
	Query,
	UseGuards,
} from '@nestjs/common';
import {
	ApiCookieAuth,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { JwtPayload, ROLES, Roles } from '@repo/common';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { RolesDecorator } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guard/jwt-auth.guard';
import { ChangeMembershipRoleCommand } from '../../application/commands/change-membership-role/change-membership-role.command';
import { ChangeMembershipRoleHandler } from '../../application/commands/change-membership-role/change-membership-role.handler';
import { DeactivateMembershipCommand } from '../../application/commands/deactivate-membership/deactivate-membership.command';
import { DeactivateMembershipHandler } from '../../application/commands/deactivate-membership/deactivate-membership.handler';
import { ChangeRoleRequestDto } from '../../application/dto/change-role.request.dto';
import { UserWithMembershipResponseDto } from '../../application/dto/user-with-membership.response.dto';
import { UserResponseDto } from '../../application/dto/user.response.dto';
import { GetCurrentUserHandler } from '../../application/queries/get-current-user/get-current-user.handler';
import { GetCurrentUserQuery } from '../../application/queries/get-current-user/get-current-user.query';
import { ListUsersByTenantHandler } from '../../application/queries/list-users-by-tenant/list-users-by-tenant.handler';
import { ListUsersByTenantQuery } from '../../application/queries/list-users-by-tenant/list-users-by-tenant.query';

// users.controller.ts
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiTags('Users')
@ApiCookieAuth('access_token')
export class UsersController {
	constructor(
		private readonly getCurrentUserHandler: GetCurrentUserHandler,
		private readonly changeMembershipRoleHandler: ChangeMembershipRoleHandler,
		private readonly deactivateMembershipHandler: DeactivateMembershipHandler,
		private readonly listUsersByTenantHandler: ListUsersByTenantHandler,
	) {}

	@Get('me')
	@ApiOperation({
		summary: 'Obtener el usuario actual',
		description:
			'Devuelve los datos del usuario autenticado dentro del tenant activo, identificado por la cookie access_token. URL: GET /users/me. La respuesta exitosa se envuelve en { success, data: UserResponseDto, timeStamp }. Los errores se envuelven en { statusCode, timestamp, path, method, message, error }. Roles permitidos: cualquier usuario autenticado (SUPERADMIN, ADMIN, PRECEPTOR, TEACHER).',
	})
	@ApiResponse({
		status: 200,
		description: 'Datos del usuario actual.',
		type: UserResponseDto,
	})
	@ApiResponse({ status: 401, description: 'No autenticado' })
	async me(@CurrentUser() user: JwtPayload) {
		return this.getCurrentUserHandler.execute(
			new GetCurrentUserQuery(user.sub, user.tenantId),
		);
	}
	// users.controller.ts — endpoints nuevos a agregar
	@Put(':id/role')
	@RolesDecorator(ROLES.ADMIN, ROLES.SUPERADMIN)
	@ApiOperation({
		summary: 'Cambiar el rol de un usuario',
		description:
			'Cambia el rol de un miembro dentro del tenant del usuario autenticado. El actor debe tener un rol con jerarquía superior al nuevo rol asignado (AuthorizationService). URL: PUT /users/6f2a8c1e-4b7d-4f5a-9d3b-2c1e4f6a8b0d/role. Body: { "newRole": "preceptor" }. La respuesta no devuelve datos (data es null). Roles permitidos: ADMIN y SUPERADMIN.',
	})
	@ApiParam({
		name: 'id',
		description: 'Identificador del usuario (UUID) cuyo rol se cambia.',
		example: '6f2a8c1e-4b7d-4f5a-9d3b-2c1e4f6a8b0d',
	})
	@ApiResponse({
		status: 200,
		description:
			'Rol actualizado. La respuesta no devuelve datos (data es null).',
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({
		status: 404,
		description: 'Usuario no encontrado o no pertenece al tenant',
	})
	async changeRole(
		@Param('id') userId: string,
		@Body() dto: ChangeRoleRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.changeMembershipRoleHandler.execute(
			new ChangeMembershipRoleCommand(
				userId,
				user.tenantId,
				dto.newRole,
				user.role,
			),
		);
	}

	@Delete(':id/membership')
	@RolesDecorator(ROLES.ADMIN, ROLES.SUPERADMIN)
	@ApiOperation({
		summary: 'Desactivar la membresía de un usuario',
		description:
			'Desactiva la membresía del usuario dentro del tenant activo; la cuenta global del usuario no se elimina. URL: DELETE /users/6f2a8c1e-4b7d-4f5a-9d3b-2c1e4f6a8b0d/membership. La respuesta no devuelve datos (data es null). Roles permitidos: ADMIN y SUPERADMIN.',
	})
	@ApiParam({
		name: 'id',
		description: 'Identificador del usuario (UUID) cuya membresía se desactiva.',
		example: '6f2a8c1e-4b7d-4f5a-9d3b-2c1e4f6a8b0d',
	})
	@ApiResponse({
		status: 200,
		description:
			'Membresía desactivada. La respuesta no devuelve datos (data es null).',
	})
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({
		status: 404,
		description: 'Usuario no encontrado o no pertenece al tenant',
	})
	async deactivateMembership(
		@Param('id') userId: string,
		@CurrentUser() user: JwtPayload,
	) {
		return this.deactivateMembershipHandler.execute(
			new DeactivateMembershipCommand(userId, user.tenantId, user.role),
		);
	}

	@Get()
	@RolesDecorator(ROLES.ADMIN, ROLES.SUPERADMIN)
	@ApiOperation({
		summary: 'Listar usuarios del tenant',
		description:
			'Lista los usuarios (con su membresía) del tenant activo, con paginación y filtro opcional por rol. URL: GET /users?role=teacher&page=1&limit=20. Devuelve { total, items: UserWithMembershipResponseDto[] } dentro del envoltorio { success, data, timeStamp }. Roles permitidos: ADMIN y SUPERADMIN.',
	})
	@ApiQuery({
		name: 'role',
		required: false,
		description: 'Filtra por rol del miembro.',
		enum: ROLES,
		example: ROLES.TEACHER,
	})
	@ApiQuery({
		name: 'page',
		required: false,
		description: 'Número de página (por defecto 1).',
		type: Number,
		example: 1,
	})
	@ApiQuery({
		name: 'limit',
		required: false,
		description: 'Resultados por página (por defecto 20).',
		type: Number,
		example: 20,
	})
	@ApiResponse({
		status: 200,
		description:
			'Usuarios del tenant paginados: { total, items: UserWithMembershipResponseDto[] }.',
	})
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	async list(
		@CurrentUser() user: JwtPayload,
		@Query('role') role?: Roles,
		@Query('page') page = 1,
		@Query('limit') limit = 20,
	) {
		return this.listUsersByTenantHandler.execute(
			new ListUsersByTenantQuery(user.tenantId, +page, +limit, role),
		);
	}
}
