import axios, { type InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config/app-config';

export const api = axios.create({
	baseURL: API_URL,
	headers: {
		'Content-Type': 'application/json',
	},
	timeout: 10000,
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
	try {
		const token = await SecureStore.getItemAsync('virttend_access_token');
		if (token && config.headers) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		const tenantId = await SecureStore.getItemAsync('virttend_tenant_id');
		if (tenantId && config.headers) {
			config.headers['x-tenant-id'] = tenantId;
		}
	} catch (error) {
		console.warn('Error reading tokens from SecureStore', error);
	}
	return config;
});
