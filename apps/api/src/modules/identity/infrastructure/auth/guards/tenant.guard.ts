import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
} from '@nestjs/common';
import { JwtPayload, ROLES } from '@repo/common';
import { getTenancyConfig } from '../../../../shared/config/tenancy.config';

const TENANT_FORBIDDEN_MESSAGE = 'No tiene acceso a esta institución.';
const SUPERADMIN_DISABLED_MESSAGE =
	'El acceso de superadministrador está deshabilitado en esta instancia.';

@Injectable()
export class TenantGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		if (this.isAllowed(context)) return true;
		throw new ForbiddenException(this.deniedMessage(context));
	}

	private deniedMessage(context: ExecutionContext): string {
		const user: JwtPayload | undefined = context.switchToHttp().getRequest().user;
		const isSuperAdmin = user?.role === ROLES.SUPERADMIN || user?.isImpersonating;
		return isSuperAdmin ? SUPERADMIN_DISABLED_MESSAGE : TENANT_FORBIDDEN_MESSAGE;
	}

	private isAllowed(context: ExecutionContext): boolean {
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
