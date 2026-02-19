import { getEnvs } from './app.config';

export const jwtConfig = {
	accessToken: {
		secret: getEnvs().JWT_SECRET,
		expiresIn: '15m',
	},
	refreshToken: {
		secret: getEnvs().JWT_REFRESH_SECRET,
		expiresIn: '7d',
	},
};
