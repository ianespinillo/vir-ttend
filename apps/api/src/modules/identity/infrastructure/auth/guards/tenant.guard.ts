import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtPayload, ROLES } from '@repo/common';
import { getTenancyConfig } from '../../../../shared/config/tenancy.config';

@Injectable()
export class TenantGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const tenancy = getTenancyConfig();
		const request = context.switchToHttp().getRequest();
		const user: JwtPayload = request.user;
		if (!user) return false;

		const isSuperAdmin = user.role === ROLES.SUPERADMIN || user.isImpersonating;
		if (isSuperAdmin) {
			if (tenancy.TENANCY_MODE === 'single' && !tenancy.ALLOW_SUPERADMIN) {
				return false;
			}
			return true;
		}

		if (tenancy.TENANCY_MODE === 'single') {
			return user.tenantId === tenancy.TENANT_ID;
		}

		const tenantId = request.params.tenantId ?? request.params.id;
		if (!tenantId || !user.tenantId) return false;
		return user.tenantId === tenantId;
	}
}
