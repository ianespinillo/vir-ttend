import axios from 'axios';
import { AUTH_ROUTES } from '../../../common/src/routes/auth.routes';

export const apiClient = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
	withCredentials: true,
	headers: {
		'Content-Type': 'application/json',
	},
});

apiClient.interceptors.request.use(
	(res) => res,
	async (error) => {
		const originalError = error.config;
		if (error.response?.status === 401 && !originalError._retry) {
			originalError._retry = true;
			await apiClient.post(AUTH_ROUTES.refresh);
			return apiClient(originalError);
		}
		return Promise.reject(error);
	},
);
