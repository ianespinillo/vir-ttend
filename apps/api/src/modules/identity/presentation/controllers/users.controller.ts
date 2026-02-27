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
import { JwtPayload, ROLES, Roles } from '@repo/common';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { RolesDecorator } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guard/jwt-auth.guard';
import { ChangeMembershipRoleCommand } from '../../application/commands/change-membership-role/change-membership-role.command';
import { ChangeMembershipRoleHandler } from '../../application/commands/change-membership-role/change-membership-role.handler';
import { DeactivateMembershipCommand } from '../../application/commands/deactivate-membership/deactivate-membership.command';
import { DeactivateMembershipHandler } from '../../application/commands/deactivate-membership/deactivate-membership.handler';
import { ChangeRoleRequestDto } from '../../application/dto/change-role.request.dto';
import { GetCurrentUserHandler } from '../../application/queries/get-current-user/get-current-user.handler';
import { GetCurrentUserQuery } from '../../application/queries/get-current-user/get-current-user.query';
import { ListUsersByTenantHandler } from '../../application/queries/list-users-by-tenant/list-users-by-tenant.handler';
import { ListUsersByTenantQuery } from '../../application/queries/list-users-by-tenant/list-users-by-tenant.query';

// users.controller.ts
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
	constructor(
		private readonly getCurrentUserHandler: GetCurrentUserHandler,
		private readonly changeMembershipRoleHandler: ChangeMembershipRoleHandler,
		private readonly deactivateMembershipHandler: DeactivateMembershipHandler,
		private readonly listUsersByTenantHandler: ListUsersByTenantHandler,
	) {}

	@Get('me')
	async me(@CurrentUser() user: JwtPayload) {
		return this.getCurrentUserHandler.execute(
			new GetCurrentUserQuery(user.sub, user.tenantId),
		);
	}
	// users.controller.ts — endpoints nuevos a agregar
	@Put(':id/role')
	@RolesDecorator(ROLES.ADMIN, ROLES.SUPERADMIN)
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
