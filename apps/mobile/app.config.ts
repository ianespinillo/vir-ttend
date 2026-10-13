import type { ExpoConfig } from 'expo/config';

/**
 * One codebase, one app per variant. The variant is picked at build/start time
 * with `APP_VARIANT` (see `eas.json` and the README). Unknown or missing values
 * fall back to the general multi-tenant app.
 */
type AppVariant = 'general' | 'eest3';

interface VariantConfig {
	name: string;
	scheme: string;
	appId: string;
	icon: string;
	/** School shown to the user before the server config is known (offline first launch). */
	schoolDisplayName: string | undefined;
	/**
	 * API base URL baked into the build. `undefined` means the shared server is
	 * not deployed yet: the app then needs `EXPO_PUBLIC_API_URL` or falls back to
	 * the localhost dev URL (see `src/config/app-config.ts`).
	 */
	apiUrl: string | undefined;
}

const VARIANTS: Record<AppVariant, VariantConfig> = {
	general: {
		name: 'Vir-ttend',
		scheme: 'virttend',
		appId: 'com.virttend.app',
		icon: './assets/icon.png',
		schoolDisplayName: undefined,
		apiUrl: undefined,
	},
	eest3: {
		name: 'EEST Nº3 Eva Perón',
		scheme: 'virttend-eest3',
		appId: 'com.virttend.eest3',
		// Placeholder until the school provides its logo.
		icon: './assets/icon.png',
		schoolDisplayName: 'Escuela de Educación Secundaria Técnica Nº3 "Eva Perón"',
		apiUrl: 'https://eest3-virttend.duckdns.org/api',
	},
};

const resolveVariant = (value: string | undefined): AppVariant =>
	value === 'eest3' ? 'eest3' : 'general';

const variant = resolveVariant(process.env.APP_VARIANT);
const variantConfig = VARIANTS[variant];

// Release builds must point at a real server: without a URL the app would fall
// back to the cleartext localhost dev URL and every request would fail on
// devices. EAS sets EAS_BUILD_PROFILE during builds; local dev is unaffected.
const buildProfile = process.env.EAS_BUILD_PROFILE ?? '';
const isReleaseBuild =
	buildProfile.startsWith('preview') || buildProfile.startsWith('production');
if (
	isReleaseBuild &&
	!variantConfig.apiUrl &&
	!process.env.EXPO_PUBLIC_API_URL
) {
	throw new Error(
		`Build profile "${buildProfile}" (variant "${variant}") has no API URL. Set EXPO_PUBLIC_API_URL in eas.json or the variant apiUrl in app.config.ts.`,
	);
}

const config: ExpoConfig = {
	name: variantConfig.name,
	// Same slug for every variant: both builds belong to one EAS project, which
	// is identified by a single slug. The variants differ by name, scheme and
	// application id instead (https://docs.expo.dev/tutorial/eas/multiple-app-variants/).
	slug: 'vir-ttend',
	owner: 'ianespi',
	scheme: variantConfig.scheme,
	version: '1.0.0',
	orientation: 'portrait',
	icon: variantConfig.icon,
	userInterfaceStyle: 'light',
	ios: {
		supportsTablet: true,
		bundleIdentifier: variantConfig.appId,
	},
	android: {
		package: variantConfig.appId,
		adaptiveIcon: {
			backgroundColor: '#E6F4FE',
			foregroundImage: './assets/android-icon-foreground.png',
			backgroundImage: './assets/android-icon-background.png',
			monochromeImage: './assets/android-icon-monochrome.png',
		},
		predictiveBackGestureEnabled: false,
	},
	web: {
		favicon: './assets/favicon.png',
	},
	plugins: [
		'expo-router',
		'expo-secure-store',
		'@react-native-community/datetimepicker',
	],
	extra: {
		appVariant: variant,
		apiUrl: variantConfig.apiUrl,
		schoolDisplayName: variantConfig.schoolDisplayName,
		// EAS project @ianespi/vir-ttend, shared by every variant.
		eas: {
			projectId: '190d6beb-651c-4d77-bb67-8297c92c5a77',
		},
	},
};

export default config;
