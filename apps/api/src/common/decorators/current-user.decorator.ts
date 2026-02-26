import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { JwtPayload } from '@repo/common';

// current-user.decorator.ts
export const CurrentUser = createParamDecorator(
	(data: unknown, ctx: ExecutionContext): JwtPayload => {
		const request = ctx.switchToHttp().getRequest();
		return request.user;
	},
);
