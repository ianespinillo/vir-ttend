import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtPayload, ROLES } from '@repo/common';

@Injectable()
export class TenantGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();
		const user: JwtPayload = request.user;
		if (user.role === ROLES.SUPERADMIN) return true;
		const tenantId = request.params.tenantId ?? request.params.id;
		if (!tenantId || !user.tenantId) return false;
		return user.tenantId === tenantId;
	}
}
