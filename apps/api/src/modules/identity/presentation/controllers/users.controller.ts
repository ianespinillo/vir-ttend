import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtPayload } from '@repo/common';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../../common/guard/jwt-auth.guard';
import { GetCurrentUserHandler } from '../../application/queries/get-current-user/get-current-user.handler';
import { GetCurrentUserQuery } from '../../application/queries/get-current-user/get-current-user.query';

// users.controller.ts
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
	constructor(private readonly getCurrentUserHandler: GetCurrentUserHandler) {}

	@Get('me')
	async me(@CurrentUser() user: JwtPayload) {
		return this.getCurrentUserHandler.execute(
			new GetCurrentUserQuery(user.sub, user.tenantId),
		);
	}
}
