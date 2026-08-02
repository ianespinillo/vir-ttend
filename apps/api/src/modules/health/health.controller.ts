import { EntityManager } from '@mikro-orm/postgresql';
import {
	Controller,
	Get,
	Inject,
	ServiceUnavailableException,
} from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../shared/cache/cache.module';

@Controller('health')
export class HealthController {
	constructor(
		private readonly em: EntityManager,
		@Inject(REDIS_CLIENT) private readonly redis: Redis,
	) {}

	@Get()
	check() {
		return {
			status: 'ok',
			timestamp: new Date().toISOString(),
			version: process.env.npm_package_version ?? 'dev',
		};
	}

	@Get('db')
	async checkDb() {
		try {
			await this.em.getConnection().execute('SELECT 1');
			return { status: 'ok', db: 'up' };
		} catch {
			throw new ServiceUnavailableException({ status: 'error', db: 'down' });
		}
	}

	@Get('redis')
	async checkRedis() {
		try {
			const pong = await this.redis.ping();
			if (pong !== 'PONG') {
				throw new Error('Unexpected ping response');
			}
			return { status: 'ok', redis: 'up' };
		} catch {
			throw new ServiceUnavailableException({ status: 'error', redis: 'down' });
		}
	}
}
