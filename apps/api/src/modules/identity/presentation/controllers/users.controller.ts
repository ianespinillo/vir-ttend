import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { RolesGuard } from '../../../../common/guard/roles.guard';
import { ChangeMembershipRoleCommand } from '../../application/commands/change-membership-role/change-membership-role.command';
import { ChangeMembershipRoleHandler } from '../../application/commands/change-membership-role/change-membership-role.handler';
import { DeactivateMembershipCommand } from '../../application/commands/deactivate-membership/deactivate-membership.command';
import { DeactivateMembershipHandler } from '../../application/commands/deactivate-membership/deactivate-membership.handler';
import { ChangeRoleRequestDto } from '../../application/dto/change-role.request.dto';
import { UserResponseDto } from '../../application/dto/user.response.dto';
import { GetCurrentUserHandler } from '../../application/queries/get-current-user/get-current-user.handler';
import { GetCurrentUserQuery } from '../../application/queries/get-current-user/get-current-user.query';
import { ListUsersByTenantHandler } from '../../application/queries/list-users-by-tenant/list-users-by-tenant.handler';
import { ListUsersByTenantQuery } from '../../application/queries/list-users-by-tenant/list-users-by-tenant.query';
import { ChangePasswordRequestDto } from '../../application/dto/change-password.request.dto';
import { ChangePasswordHandler } from '../../application/commands/change-password/change-password.handler';
import { ChangePasswordCommand } from '../../application/commands/change-password/change-password.command';
import { Password } from '../../domain/value-objects/password.vo';
import { CreateUserHandler } from '../../application/commands/create-user/create-user.handler';
import { CreateUserRequestDto } from '../../application/dto/create-user.request.dto';
import { CreateUserCommand } from '../../application/commands/create-user/create-user.command';
import { UpdateUserHandler } from '../../application/commands/update-user/update-user.handler';
import { UpdateUserCommand } from '../../application/commands/update-user/update-user.command';
import { UpdateUserRequestDto } from '../../application/dto/update-user.request.dto';
import { Email } from '../../domain/value-objects/email.vo';

// users.controller.ts
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Users')
@ApiCookieAuth('access_token')
export class UsersController {
  constructor(
    private readonly createUserHandler: CreateUserHandler,
    private readonly getCurrentUserHandler: GetCurrentUserHandler,
    private readonly changeMembershipRoleHandler: ChangeMembershipRoleHandler,
    private readonly deactivateMembershipHandler: DeactivateMembershipHandler,
    private readonly listUsersByTenantHandler: ListUsersByTenantHandler,
    private readonly changePasswordHandler: ChangePasswordHandler,
    private readonly updateUserHandler: UpdateUserHandler,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateUserRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.createUserHandler.execute(
      new CreateUserCommand(
        dto.email,
        dto.firstName,
        dto.lastName,
        dto.role,
        user.role,
        user.tenantId,
      ),
    );
  }
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
    description:
      'Identificador del usuario (UUID) cuya membresía se desactiva.',
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
  @ApiQuery({
    name: 'tenantId',
    required: false,
    description:
      'Tenant a listar (solo SUPERADMIN puede listar un tenant distinto al suyo).',
    example: '2d4e0f5a-8c1b-4d3e-9a2f-6b8c0d1e2f3a',
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
    @Query('tenantId') tenantId?: string,
    @Query('role') role?: Roles,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const effectiveTenant =
      user.role === ROLES.SUPERADMIN
        ? tenantId === undefined
          ? user.tenantId
          : tenantId
        : user.tenantId;
    return this.listUsersByTenantHandler.execute(
      new ListUsersByTenantQuery(effectiveTenant, +page, +limit, role),
    );
  }

  @Patch('me/password')
  @ApiOperation({
    summary: 'Cambiar la contraseña del usuario actual',
    description:
      'Permite al usuario autenticado cambiar su propia contraseña. URL: PATCH /users/me/password. Body: { "oldPassword": "oldPass", "newPassword": "newPass", "confirmNewPassword": "newPass" }. La respuesta no devuelve datos (data es null). Roles permitidos: cualquier usuario autenticado (SUPERADMIN, ADMIN, PRECEPTOR, TEACHER).',
  })
  @ApiResponse({
    status: 200,
    description:
      'Contraseña cambiada exitosamente. La respuesta no devuelve datos (data es null).',
  })
  @ApiResponse({ status: 400, description: 'Validación falló' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordRequestDto,
  ) {
    return this.changePasswordHandler.execute(
      new ChangePasswordCommand(
        user.sub,
        new Password(dto.oldPassword),
        new Password(dto.newPassword),
      ),
    );
  }

  @RolesDecorator(ROLES.ADMIN, ROLES.SUPERADMIN)
  @Put(':id')
  async updateUser(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateUserRequestDto,
  ) {
    const props: UpdateUserCommand['props'] = {};
    if (dto.firstName) props.firstName = dto.firstName;
    if (dto.lastName) props.lastName = dto.lastName;
    if (dto.email) props.email = new Email(dto.email);
    return this.updateUserHandler.execute(
      new UpdateUserCommand(id, user.tenantId, props),
    );
  }
}
