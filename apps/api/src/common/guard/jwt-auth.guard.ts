import {
	HttpException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayload } from '@repo/common';

export const INVALID_SESSION_MESSAGE =
	'Su sesión expiró o no es válida. Inicie sesión nuevamente.';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	handleRequest<TUser = JwtPayload>(err: Error | null, user: TUser): TUser {
		if (err instanceof HttpException) throw err;
		// Passport reports a missing, malformed or expired token either as a
		// plain error or as no user; both mean the session is not valid (401).
		if (err || !user) {
			throw new UnauthorizedException(INVALID_SESSION_MESSAGE);
		}
		return user;
	}
}
