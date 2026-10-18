import { hexToRgbTriplet } from '../color.js';
import { VIRTTEND_BRANDING } from '../defaults.js';
import { type BrandTokens, SCALE, deriveBrandTokens } from '../tokens.js';

export type ColorScheme = 'light' | 'dark';

/**
 * CSS variables for NativeWind `vars()`, values as "R G B". The palette is the
 * same in both schemes; only `--brand-primary-ink` (text and icons in the
 * primary color) moves to the 200 step in dark mode to stay legible.
 */
export const toNativeWindVars = (
	t: BrandTokens,
	scheme: ColorScheme = 'light',
): Record<string, string> => {
	const vars: Record<string, string> = {
		'--brand-primary': hexToRgbTriplet(t.primary),
		'--brand-on-primary': hexToRgbTriplet(t.onPrimary),
		'--brand-primary-ink': hexToRgbTriplet(
			scheme === 'dark' ? t.scale[200] : t.primary,
		),
	};
	for (const step of SCALE) {
		vars[`--brand-primary-${step}`] = hexToRgbTriplet(t.scale[step]);
	}
	vars['--brand-accent'] = hexToRgbTriplet(t.accent);
	vars['--brand-on-accent'] = hexToRgbTriplet(t.onAccent);
	return vars;
};

const rgbVar = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

/** Fragment to spread into `theme.extend.colors` of the mobile `tailwind.config.js`. */
export const nativewindPrimaryColors = {
	primary: {
		DEFAULT: rgbVar('brand-primary'),
		foreground: rgbVar('brand-on-primary'),
		ink: rgbVar('brand-primary-ink'),
		50: rgbVar('brand-primary-50'),
		100: rgbVar('brand-primary-100'),
		200: rgbVar('brand-primary-200'),
		300: rgbVar('brand-primary-300'),
		400: rgbVar('brand-primary-400'),
		500: rgbVar('brand-primary-500'),
		600: rgbVar('brand-primary-600'),
		700: rgbVar('brand-primary-700'),
		800: rgbVar('brand-primary-800'),
		900: rgbVar('brand-primary-900'),
	},
	accent: {
		DEFAULT: rgbVar('brand-accent'),
		foreground: rgbVar('brand-on-accent'),
	},
} as const;

export const NATIVE_DEFAULT_VARS = toNativeWindVars(
	deriveBrandTokens(VIRTTEND_BRANDING.colors),
);
