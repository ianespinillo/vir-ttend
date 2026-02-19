import * as env from 'env-var';

export const getRedisConfig = () => ({
	REDIS_URL: env.get('REDIS_URL').default('reids://localhost:6379').asString(),
});
