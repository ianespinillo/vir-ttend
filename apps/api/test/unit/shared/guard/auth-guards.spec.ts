import {
	ExecutionContext,
	ForbiddenException,
	UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES } from '@repo/common';
import { JwtAuthGuard } from '../../../../src/common/guard/jwt-auth.guard';
import { RolesGuard } from '../../../../src/common/guard/roles.guard';

const SESSION_MESSAGE =
	'Su sesión expiró o no es válida. Inicie sesión nuevamente.';

describe('JwtAuthGuard.handleRequest', () => {
	const guard = new JwtAuthGuard();

	it('answers 401 in Spanish when there is no user', () => {
		const handle = () => guard.handleRequest(null as unknown as Error, false);
		expect(handle).toThrow(UnauthorizedException);
		expect(handle).toThrow(SESSION_MESSAGE);
	});

	it('answers 401, not 500, when passport fails with a plain error', () => {
		const handle = () => guard.handleRequest(new Error('jwt malformed'), false);
		expect(handle).toThrow(UnauthorizedException);
		expect(handle).toThrow(SESSION_MESSAGE);
	});

	it('returns the authenticated user', () => {
		const user = { sub: 'u-1' };
		expect(guard.handleRequest(null as unknown as Error, user)).toBe(user);
	});
});

describe('RolesGuard', () => {
	const contextFor = (user: unknown) =>
		({
			getHandler: () => undefined,
			getClass: () => undefined,
			switchToHttp: () => ({ getRequest: () => ({ user }) }),
		}) as unknown as ExecutionContext;
	const reflector = {
		getAllAndOverride: () => [ROLES.ADMIN],
	} as unknown as Reflector;
	const guard = new RolesGuard(reflector);

	it('answers 403 in Spanish when the role is not allowed', () => {
		const activate = () =>
			guard.canActivate(contextFor({ sub: 'u-1', role: ROLES.TEACHER }));
		expect(activate).toThrow(ForbiddenException);
		expect(activate).toThrow('No tiene permiso para realizar esta acción.');
	});

	it('allows a user with a required role', () => {
		expect(guard.canActivate(contextFor({ sub: 'u-1', role: ROLES.ADMIN }))).toBe(
			true,
		);
	});
});
