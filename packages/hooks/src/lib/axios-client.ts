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

// INTERCEPTOR DE RESPUESTA (antes estaba mal en request)
apiClient.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		const originalRequest = error.config as RetriableRequestConfig | undefined;
		if (
			error.response?.status === 401 &&
			originalRequest &&
			!originalRequest._retry &&
			originalRequest.url !== AUTH_ROUTES.refresh
		) {
			originalRequest._retry = true;
			await apiClient.post(AUTH_ROUTES.refresh);
			return apiClient(originalRequest);
		}
		return Promise.reject(error);
	},
);
