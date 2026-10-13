import * as SecureStore from 'expo-secure-store';

export type TenancyMode = 'single' | 'multi';

export interface MobileAppConfig {
	appName: string;
	tenancyMode: TenancyMode;
	defaultTenantId: string | null;
	defaultTenantName: string | null;
	apiUrl: string;
}

const STORAGE_KEY_CUSTOM_APP_NAME = 'virttend_custom_app_name';
const STORAGE_KEY_TENANCY_MODE = 'virttend_tenancy_mode';

export const getAppConfig = async (): Promise<MobileAppConfig> => {
	const customName = await SecureStore.getItemAsync(STORAGE_KEY_CUSTOM_APP_NAME);
	const customMode = (await SecureStore.getItemAsync(
		STORAGE_KEY_TENANCY_MODE,
	)) as TenancyMode | null;

	const envMode = (process.env.EXPO_PUBLIC_TENANCY_MODE ||
		'multi') as TenancyMode;
	const envAppName = process.env.EXPO_PUBLIC_APP_NAME || 'Vir-ttend';

	return {
		appName: customName || envAppName,
		tenancyMode: customMode || envMode,
		defaultTenantId: process.env.EXPO_PUBLIC_DEFAULT_TENANT_ID || null,
		defaultTenantName:
			process.env.EXPO_PUBLIC_DEFAULT_TENANT_NAME || 'Colegio Institucional',
		apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001',
	};
};

export const saveCustomAppName = async (name: string): Promise<void> => {
	if (!name.trim()) {
		await SecureStore.deleteItemAsync(STORAGE_KEY_CUSTOM_APP_NAME);
	} else {
		await SecureStore.setItemAsync(STORAGE_KEY_CUSTOM_APP_NAME, name.trim());
	}
};

export const saveTenancyMode = async (mode: TenancyMode): Promise<void> => {
	await SecureStore.setItemAsync(STORAGE_KEY_TENANCY_MODE, mode);
};
