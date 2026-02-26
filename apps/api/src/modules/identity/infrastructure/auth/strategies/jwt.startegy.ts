import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { JwtPayload } from '@repo/common';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
	constructor(configService: ConfigService) {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				(request: Request) => request?.cookies?.access_token ?? null,
			]),
			ignoreExpiration: false,
			secretOrKey: configService.get<string>('JWT_SECRET') ?? 'SECRET_KEY',
		});
	}

	async validate(payload: JwtPayload): Promise<JwtPayload> {
		return payload;
	}
}
