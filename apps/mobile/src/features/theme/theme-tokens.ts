import type { BrandTokens } from '@repo/branding';
import type { ColorScheme } from '@repo/branding/native';
import { JUSTIFIED_TONE, JUSTIFIED_TONE_DARK } from '../branding/status-colors';

export type { ColorScheme };

/**
 * Single source of truth for the scheme-aware neutrals. Light values are the
 * exact slate colors the app used before dark mode, so light renders as before.
 * `global.css` mirrors these values as defaults; `BrandProvider` injects the
 * active scheme's set at runtime with NativeWind `vars()`.
 */
const NEUTRALS = {
	light: {
		background: '#F8FAFC',
		card: '#FFFFFF',
		foreground: '#0F172A',
		muted: '#F1F5F9',
		mutedForeground: '#64748B',
		border: '#E2E8F0',
		// Scheme-aware slate steps for shades without a semantic name.
		neutral300: '#CBD5E1',
		neutral400: '#94A3B8',
		neutral600: '#475569',
		neutral700: '#334155',
		neutral800: '#1E293B',
	},
	dark: {
		background: '#020617',
		card: '#0F172A',
		foreground: '#F1F5F9',
		muted: '#1E293B',
		mutedForeground: '#94A3B8',
		border: '#1E293B',
		neutral300: '#334155',
		neutral400: '#64748B',
		neutral600: '#CBD5E1',
		neutral700: '#E2E8F0',
		neutral800: '#F1F5F9',
	},
} as const satisfies Record<ColorScheme, Record<string, string>>;

export type NeutralName = keyof (typeof NEUTRALS)['light'];
export type NeutralPalette = Record<NeutralName, string>;

/** CSS variable name per neutral (`--color-muted-foreground`, ...). */
const NEUTRAL_VARS: Record<NeutralName, string> = {
	background: '--color-background',
	card: '--color-card',
	foreground: '--color-foreground',
	muted: '--color-muted',
	mutedForeground: '--color-muted-foreground',
	border: '--color-border',
	neutral300: '--color-neutral-300',
	neutral400: '--color-neutral-400',
	neutral600: '--color-neutral-600',
	neutral700: '--color-neutral-700',
	neutral800: '--color-neutral-800',
};

/** Resolves React Native's scheme (which may be `unspecified`/null) to light or dark. */
export const resolveColorScheme = (
	scheme: string | null | undefined,
): ColorScheme => (scheme === 'dark' ? 'dark' : 'light');

export const getNeutrals = (scheme: ColorScheme): NeutralPalette =>
	NEUTRALS[scheme];

const hexToTriplet = (hex: string) => {
	const value = Number.parseInt(hex.slice(1), 16);
	return `${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255}`;
};

/** Neutral CSS variables ("R G B") for NativeWind `vars()`. */
export const toNeutralVars = (scheme: ColorScheme): Record<string, string> => {
	const neutrals = NEUTRALS[scheme];
	const vars: Record<string, string> = {};
	for (const name of Object.keys(NEUTRAL_VARS) as NeutralName[]) {
		vars[NEUTRAL_VARS[name]] = hexToTriplet(neutrals[name]);
	}
	return vars;
};

/** Tint + ink set for a status color applied through inline style. */
export interface StatusTone {
	background: string;
	border: string;
	text: string;
	strongText: string;
	icon: string;
}

export type StatusName = 'success' | 'warning' | 'danger' | 'justified';

/**
 * Status hues stay the same in both schemes; only light tints become
 * translucent and the ink gets lighter in dark so it reads on dark surfaces.
 */
const STATUS_TONES: Record<ColorScheme, Record<StatusName, StatusTone>> = {
	light: {
		success: {
			background: '#ECFDF5',
			border: '#A7F3D0',
			text: '#047857',
			strongText: '#065F46',
			icon: '#059669',
		},
		warning: {
			background: '#FFFBEB',
			border: '#FDE68A',
			text: '#B45309',
			strongText: '#92400E',
			icon: '#D97706',
		},
		danger: {
			background: '#FEF2F2',
			border: '#FECACA',
			text: '#B91C1C',
			strongText: '#991B1B',
			icon: '#DC2626',
		},
		justified: JUSTIFIED_TONE,
	},
	dark: {
		success: {
			background: 'rgba(16, 185, 129, 0.14)',
			border: 'rgba(16, 185, 129, 0.4)',
			text: '#6EE7B7',
			strongText: '#A7F3D0',
			icon: '#34D399',
		},
		warning: {
			background: 'rgba(245, 158, 11, 0.14)',
			border: 'rgba(245, 158, 11, 0.4)',
			text: '#FCD34D',
			strongText: '#FDE68A',
			icon: '#FBBF24',
		},
		danger: {
			background: 'rgba(239, 68, 68, 0.14)',
			border: 'rgba(239, 68, 68, 0.4)',
			text: '#FCA5A5',
			strongText: '#FECACA',
			icon: '#F87171',
		},
		justified: JUSTIFIED_TONE_DARK,
	},
};

export interface ThemePalette extends NeutralPalette {
	scheme: ColorScheme;
	/** Exact brand primary, for solid surfaces (same in both schemes). */
	primary: string;
	onPrimary: string;
	/** Primary as text/icon/border color: the primary in light, scale 200 in dark. */
	primaryInk: string;
	accent: string;
	/** Neutral "pending" tone (slate tint) for status badges. */
	neutralTone: Pick<StatusTone, 'background' | 'border' | 'text'>;
	status: Record<StatusName, StatusTone>;
	/** Destructive solid (red-500), used for destructive icons. */
	destructive: string;
}

/** Imperative palette (lucide `color`, `ActivityIndicator`, inline styles). */
export const getThemePalette = (
	scheme: ColorScheme,
	brand: BrandTokens,
): ThemePalette => {
	const neutrals = NEUTRALS[scheme];
	return {
		...neutrals,
		scheme,
		primary: brand.primary,
		onPrimary: brand.onPrimary,
		primaryInk: scheme === 'dark' ? brand.scale[200] : brand.primary,
		accent: brand.accent,
		neutralTone: {
			background: neutrals.muted,
			border: scheme === 'dark' ? neutrals.neutral300 : neutrals.border,
			text: neutrals.neutral600,
		},
		status: STATUS_TONES[scheme],
		destructive: scheme === 'dark' ? '#F87171' : '#EF4444',
	};
};
