import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '@repo/common';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private readonly refletor: Reflector) {}
	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.refletor.getAllAndOverride<Roles[]>('roles', [
			context.getHandler(),
			context.getClass(),
		]);
		if (!requiredRoles) return true;
		const { user } = context.switchToHttp().getRequest();
		return requiredRoles.includes(user.role);
	}
}
