import 'dotenv/config';
import * as env from 'env-var';
import { getDatabaseConfig } from './database.config';
import { getRedisConfig } from './redis.config,';
import { getTenancyConfig } from './tenancy.config';

const INSECURE_DEFAULT_SECRETS = [
	'vir_ttend_super_secret_jwt_key_2026',
	'vir_ttend_super_secret_refresh_jwt_key_2026',
	'change_me',
	'change_me_refresh',
	'SECRET_KEY',
	'secret',
	'password',
	'123456',
];

export const validateAppConfig = (config: Record<string, unknown>) => {
	if (config.NODE_ENV === 'production') {
		const jwtSecret =
			typeof config.JWT_SECRET === 'string' ? config.JWT_SECRET : undefined;
		const jwtRefreshSecret =
			typeof config.JWT_REFRESH_SECRET === 'string'
				? config.JWT_REFRESH_SECRET
				: undefined;

		if (!jwtSecret || !jwtRefreshSecret) {
			throw new Error(
				'JWT_SECRET and JWT_REFRESH_SECRET must be set in production',
			);
		}
		if (jwtSecret === jwtRefreshSecret) {
			throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must not be identical');
		}
		if (
			INSECURE_DEFAULT_SECRETS.includes(jwtSecret) ||
			INSECURE_DEFAULT_SECRETS.includes(jwtRefreshSecret)
		) {
			throw new Error(
				'Insecure default JWT secrets cannot be used in production environment',
			);
		}
		if (!config.DATABASE_URL) {
			throw new Error('DATABASE_URL is required in production');
		}
		if (!config.REDIS_URL) {
			throw new Error('REDIS_URL is required in production');
		}
	}
};

export const getEnvs = () => {
	const tenancy = getTenancyConfig();
	const base = {
		PORT: env.get('PORT').default(3001).asInt(),
		NODE_ENV: env.get('NODE_ENV').default('development').asString(),
		CORS_ORIGINS: env
			.get('CORS_ORIGINS')
			.default('http://localhost:3000,http://127.0.0.1:3000')
			.asArray(),
		JWT_SECRET: env.get('JWT_SECRET').required().asString(),
		JWT_REFRESH_SECRET: env.get('JWT_REFRESH_SECRET').required().asString(),
		...getRedisConfig(),
		...getDatabaseConfig(),
		...tenancy,
	};
	validateAppConfig(base);
	return base;
};
