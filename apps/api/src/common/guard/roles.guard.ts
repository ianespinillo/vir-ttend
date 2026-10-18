import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES, Roles } from '@repo/common';

const FORBIDDEN_MESSAGE = 'No tiene permiso para realizar esta acción.';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}
	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<Roles[]>('roles', [
			context.getHandler(),
			context.getClass(),
		]);
		if (!requiredRoles || requiredRoles.length === 0) return true;
		const { user } = context.switchToHttp().getRequest();
		if (!user) throw new ForbiddenException(FORBIDDEN_MESSAGE);
		if (user.isImpersonating && requiredRoles.includes(ROLES.SUPERADMIN)) {
			return true;
		}
		if (!requiredRoles.includes(user.role)) {
			throw new ForbiddenException(FORBIDDEN_MESSAGE);
		}
		return true;
	}
}
