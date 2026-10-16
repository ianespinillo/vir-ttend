import { AUTH_ROUTES } from '@repo/common';
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const apiClient = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
	withCredentials: true,
	headers: {
		'Content-Type': 'application/json',
	},
});

// A 401 on these endpoints is a credentials/session problem, not an expired
// access token: refreshing would hide the real error from the user.
const NO_REFRESH_ROUTES: readonly string[] = [
	AUTH_ROUTES.login,
	AUTH_ROUTES.selectTenant,
	AUTH_ROUTES.refresh,
	AUTH_ROUTES.logout,
];

// INTERCEPTOR DE RESPUESTA (antes estaba mal en request)
apiClient.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		const originalRequest = error.config as RetriableRequestConfig | undefined;
		if (
			error.response?.status === 401 &&
			originalRequest &&
			!originalRequest._retry &&
			!NO_REFRESH_ROUTES.includes(originalRequest.url ?? '')
		) {
			originalRequest._retry = true;
			await apiClient.post(AUTH_ROUTES.refresh);
			return apiClient(originalRequest);
		}
		return Promise.reject(error);
	},
);
