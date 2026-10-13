import { type PublicBranding, publicBrandingSchema } from '@repo/branding';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

export type TenancyMode = 'single' | 'multi';

export type AppVariant = 'general' | 'eest3';

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

/** Host (and port) of a URL, for display. Pure. */
export const getUrlHost = (url: string): string =>
	url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').split(/[/?#]/)[0];

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

/** Build variant of this binary (`APP_VARIANT` at build time). */
export const APP_VARIANT: AppVariant =
	Constants.expoConfig?.extra?.appVariant === 'eest3' ? 'eest3' : 'general';

/** Version shown in Settings (`version` in `app.config.ts`). */
export const APP_VERSION: string = Constants.expoConfig?.version ?? '0.0.0';

/** Facts fixed when the app is built, as opposed to the server config. */
export interface StaticAppInfo {
	appName: string;
	/** School the build is made for (school variants only). */
	variantSchoolName: string | null;
	/** Branding baked into the build (`extra.branding`), for the first launch offline. */
	variantBranding: PublicBranding | null;
	apiUrl: string;
	variant: AppVariant;
}

const variantSchoolName: unknown =
	Constants.expoConfig?.extra?.schoolDisplayName;

const parsedVariantBranding = publicBrandingSchema.safeParse(
	Constants.expoConfig?.extra?.branding,
);

export const STATIC_APP_INFO: StaticAppInfo = {
	appName: Constants.expoConfig?.name ?? 'Vir-ttend',
	variantSchoolName:
		typeof variantSchoolName === 'string' && variantSchoolName.trim()
			? variantSchoolName.trim()
			: null,
	variantBranding: parsedVariantBranding.success
		? parsedVariantBranding.data
		: null,
	apiUrl: API_URL,
	variant: APP_VARIANT,
};

// Tenancy mode and app name used to be user settings stored on the device. The
// server owns them now, so any leftover value is removed.
const LEGACY_SECURE_STORE_KEYS = [
	'virttend_tenancy_mode',
	'virttend_custom_app_name',
];

/** Best effort: removes the retired settings so they cannot be mistaken for config. */
export const clearLegacyConfigKeys = async (): Promise<void> => {
	await Promise.all(
		LEGACY_SECURE_STORE_KEYS.map(async (key) => {
			try {
				await SecureStore.deleteItemAsync(key);
			} catch (error) {
				console.warn(`Could not delete legacy setting ${key}`, error);
			}
		}),
	);
};
