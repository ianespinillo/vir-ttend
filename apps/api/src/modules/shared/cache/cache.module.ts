import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { getRedisConfig } from '../config/redis.config,';
import { getTenancyConfig } from '../config/tenancy.config';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
	providers: [
		{
			provide: REDIS_CLIENT,
			useFactory: () => {
				const redisUrl = getRedisConfig().REDIS_URL;
				const tenancy = getTenancyConfig();
				const prefix = tenancy.INSTANCE_ID || tenancy.TENANT_SLUG;
				return new Redis(redisUrl, {
					keyPrefix: prefix ? `${prefix}:` : undefined,
				});
			},
		},
	],
	exports: [REDIS_CLIENT],
})
export class CacheModule {}
