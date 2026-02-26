import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayload } from '@repo/common';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	handleRequest<TUser = JwtPayload>(err: Error, user: TUser): TUser {
		if (err || !user) {
			throw err ?? new UnauthorizedException();
		}
		return user;
	}
}
