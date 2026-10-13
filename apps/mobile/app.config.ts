import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
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
	/**
	 * Folder with the variant's launcher icon, adaptive icon layers, splash and
	 * favicon. Every variant ships the same file names.
	 */
	assetsDir: string;
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
		assetsDir: './assets/variants/general',
		schoolDisplayName: undefined,
		apiUrl: undefined,
	},
	eest3: {
		name: 'EEST Nº3 Eva Perón',
		scheme: 'virttend-eest3',
		appId: 'com.virttend.eest3',
		assetsDir: './assets/variants/eest3',
		schoolDisplayName: 'Escuela de Educación Secundaria Técnica Nº3 "Eva Perón"',
		apiUrl: 'https://eest3-virttend.duckdns.org/api',
	},
};

const resolveVariant = (value: string | undefined): AppVariant =>
	value === 'eest3' ? 'eest3' : 'general';

const variant = resolveVariant(process.env.APP_VARIANT);
const variantConfig = VARIANTS[variant];

interface BrandingFileShape {
	displayName: string;
	shortName: string;
	colors: { primary: string; accent?: string; highlight?: string };
	assets?: {
		crest?: string;
		crestSmall?: string;
		crestSmallPng?: string;
		favicon?: string;
	};
}

/**
 * Branding baked into the build so the first launch (offline, or before
 * `/config/public` answers) already shows the school identity. Same source as the
 * server (`deploy/branding/<variant>/branding.json`) and same shape as
 * `PublicBranding` (`@repo/branding`), which `app-config.ts` validates at runtime.
 * Returns `undefined` when the variant has no branding file: the app then falls
 * back to the Vir-ttend brand.
 */
const readVariantBranding = (name: AppVariant) => {
	const file = join(
		__dirname,
		'..',
		'..',
		'deploy',
		'branding',
		name,
		'branding.json',
	);
	if (!existsSync(file)) return undefined;
	try {
		const data = JSON.parse(readFileSync(file, 'utf8')) as BrandingFileShape;
		const version = `baked-${name}`;
		const url = (asset: string | undefined) =>
			asset ? `/branding/${asset}?v=${version}` : null;
		return {
			source: 'instance',
			version,
			displayName: data.displayName,
			shortName: data.shortName,
			colors: {
				primary: data.colors.primary,
				accent: data.colors.accent ?? null,
				highlight: data.colors.highlight ?? null,
			},
			assets: {
				crest: url(data.assets?.crest),
				crestSmall: url(data.assets?.crestSmall),
				crestSmallPng: url(data.assets?.crestSmallPng),
				favicon: url(data.assets?.favicon),
			},
			showPoweredBy: true,
		};
	} catch (error) {
		console.warn(`Could not read branding for variant "${name}"`, error);
		return undefined;
	}
};

const variantBranding =
	variant === 'general' ? undefined : readVariantBranding(variant);

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
	icon: `${variantConfig.assetsDir}/icon.png`,
	userInterfaceStyle: 'light',
	ios: {
		supportsTablet: true,
		bundleIdentifier: variantConfig.appId,
	},
	android: {
		package: variantConfig.appId,
		adaptiveIcon: {
			foregroundImage: `${variantConfig.assetsDir}/android-icon-foreground.png`,
			backgroundImage: `${variantConfig.assetsDir}/android-icon-background.png`,
			monochromeImage: `${variantConfig.assetsDir}/android-icon-monochrome.png`,
		},
		predictiveBackGestureEnabled: false,
	},
	web: {
		favicon: `${variantConfig.assetsDir}/favicon.png`,
	},
	plugins: [
		'expo-router',
		'expo-secure-store',
		'@react-native-community/datetimepicker',
		[
			'expo-splash-screen',
			{
				image: `${variantConfig.assetsDir}/splash-icon.png`,
				backgroundColor: '#FFFFFF',
				imageWidth: 200,
			},
		],
	],
	extra: {
		appVariant: variant,
		apiUrl: variantConfig.apiUrl,
		schoolDisplayName: variantConfig.schoolDisplayName,
		branding: variantBranding,
		// EAS project @ianespi/vir-ttend, shared by every variant.
		eas: {
			projectId: '190d6beb-651c-4d77-bb67-8297c92c5a77',
		},
	},
};

export default config;
