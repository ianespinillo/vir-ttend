import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtPayload } from '@repo/common';

@Injectable()
export class TenantGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();
		const user: JwtPayload = request.user;

		if (!user.tenantId) return true;

		const tenantId = request.params.tenantId ?? request.params.id;
		if (!tenantId) return true;

		return user.tenantId === tenantId;
	}
}
