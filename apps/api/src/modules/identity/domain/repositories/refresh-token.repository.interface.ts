import { RefreshToken } from '../entities/refresh-token.entity';

export interface IRefreshTokenRepository {
	save(token: RefreshToken): Promise<void>;
	findByHash(token: string): Promise<RefreshToken | null>;
	revokeAllByUserId(userId: string): Promise<void>;
}
