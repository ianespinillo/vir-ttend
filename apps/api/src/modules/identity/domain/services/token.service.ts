import { createHash, randomBytes } from 'node:crypto';
import { JwtPayload } from '@repo/common';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../../../shared/config/jwt.config';
export class TokenService {
	generateAccessToken(payload: JwtPayload): string {
		return jwt.sign(payload, jwtConfig.accessToken.secret, {
			expiresIn: jwtConfig.accessToken.expiresIn,
		});
	}
	generateRefreshToken(): string {
		return randomBytes(32).toString('hex');
	}
	verifyAccessToken(token: string): JwtPayload {
		const decoded = jwt.verify(token, jwtConfig.accessToken.secret);
		return decoded as JwtPayload;
	}
	hashToken(token: string): string {
		return createHash('sha256').update(token).digest('hex');
	}
}
