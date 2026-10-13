import axios, { type InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// In development, default to localhost on iOS/Web or 10.0.2.2 on Android emulator
const getDefaultBaseUrl = () => {
	if (process.env.EXPO_PUBLIC_API_URL) {
		return process.env.EXPO_PUBLIC_API_URL;
	}
	if (Platform.OS === 'android') {
		return 'http://10.0.2.2:3001';
	}
	return 'http://localhost:3001';
};

export const api = axios.create({
	baseURL: getDefaultBaseUrl(),
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
