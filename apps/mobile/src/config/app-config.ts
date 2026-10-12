import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

export type TenancyMode = 'single' | 'multi';

export interface MobileAppConfig {
	appName: string;
	tenancyMode: TenancyMode;
	defaultTenantId: string | null;
	defaultTenantName: string | null;
	apiUrl: string;
}

export const DEFAULT_API_URL = 'http://localhost:3001';

const stripTrailingSlashes = (url: string): string => url.replace(/\/+$/, '');

/**
 * Picks the API base URL. Pure.
 *
 * Order: `EXPO_PUBLIC_API_URL` (dev / per-build override) -> the variant's
 * `extra.apiUrl` (see `app.config.ts`) -> the localhost dev fallback.
 */
export const resolveApiUrl = (
	envUrl: string | undefined,
	variantUrl: unknown,
): string => {
	const fromVariant = typeof variantUrl === 'string' ? variantUrl : undefined;
	const chosen = envUrl?.trim() || fromVariant?.trim() || DEFAULT_API_URL;
	return stripTrailingSlashes(chosen);
};

/**
 * Single source of truth for the API base URL.
 *
 * Defaults to `http://localhost:3001` on every platform. On a physical Android
 * device (or emulator) `localhost` reaches the host machine through
 * `adb reverse` (see `pnpm --filter mobile android:reverse`). Set
 * `EXPO_PUBLIC_API_URL` to point at a different API; release builds get theirs
 * from the build variant.
 */
export const API_URL: string = resolveApiUrl(
	process.env.EXPO_PUBLIC_API_URL,
	Constants.expoConfig?.extra?.apiUrl,
);

export type AppVariant = 'general' | 'eest3';

/** Build variant of this binary (`APP_VARIANT` at build time). */
export const APP_VARIANT: AppVariant =
	Constants.expoConfig?.extra?.appVariant === 'eest3' ? 'eest3' : 'general';

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
		apiUrl: API_URL,
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
