import * as env from 'env-var';
import { getDatabaseConfig } from './database.config';
import { getRedisConfig } from './redis.config,';
export const getEnvs = () => ({
	PORT: env.get('PORT').default(3001).asInt(),
	NODE_ENV: env.get('NODE_ENV').default('development').asString(),
	JWT_SECRET: env.get('JWT_SECRET').required().asString(),
	JWT_REFRESH_SECRET: env.get('JWT_REFRESH_SECRET').required().asString(),
	...getRedisConfig(),
	...getDatabaseConfig(),
});
