import * as env from 'env-var';

export const getDatabaseConfig = () => ({
	DATABASE_URL: env.get('DATABASE_URL').required().asString(),
});
