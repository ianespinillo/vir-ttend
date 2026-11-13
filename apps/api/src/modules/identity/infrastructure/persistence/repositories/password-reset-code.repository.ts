import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../../shared/cache/cache.module';
import {
	IPasswordResetCodeRepository,
	PasswordResetCodeEntry,
} from '../../../domain/repositories/password-reset-code.repository.interface';

const keyFor = (userId: string): string => `password-reset:${userId}`;

/**
 * Pending reset codes live in Redis: they are short lived, so the TTL does the
 * cleanup and no table or migration is needed.
 */
@Injectable()
export class RedisPasswordResetCodeRepository
	implements IPasswordResetCodeRepository
{
	constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

	async save(
		userId: string,
		entry: PasswordResetCodeEntry,
		ttlSeconds: number,
	): Promise<void> {
		await this.redis.set(keyFor(userId), JSON.stringify(entry), 'EX', ttlSeconds);
	}

	async find(userId: string): Promise<PasswordResetCodeEntry | null> {
		const raw = await this.redis.get(keyFor(userId));
		if (!raw) return null;
		try {
			const parsed = JSON.parse(raw) as Partial<PasswordResetCodeEntry>;
			if (
				typeof parsed.codeHash !== 'string' ||
				typeof parsed.attempts !== 'number' ||
				typeof parsed.issuedAt !== 'number'
			) {
				return null;
			}
			return {
				codeHash: parsed.codeHash,
				attempts: parsed.attempts,
				issuedAt: parsed.issuedAt,
			};
		} catch {
			return null;
		}
	}

	async incrementAttempts(userId: string): Promise<void> {
		const entry = await this.find(userId);
		if (!entry) return;
		await this.redis.set(
			keyFor(userId),
			JSON.stringify({ ...entry, attempts: entry.attempts + 1 }),
			'KEEPTTL',
		);
	}

	async delete(userId: string): Promise<void> {
		await this.redis.del(keyFor(userId));
	}
}
