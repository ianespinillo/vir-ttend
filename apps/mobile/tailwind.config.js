const { nativewindPrimaryColors } = require('@repo/branding/native');

/** Scheme-aware neutral read from the `--color-*` variables (see global.css). */
const themeVar = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./app/**/*.{js,jsx,ts,tsx}',
		'./components/**/*.{js,jsx,ts,tsx}',
		'./src/**/*.{js,jsx,ts,tsx}',
	],
	presets: [require('nativewind/preset')],
	// `media` (NativeWind's default): on native, `dark:` follows React Native
	// `Appearance`, which `ThemeProvider` drives for the Claro/Oscuro/Sistema choice.
	darkMode: 'media',
	theme: {
		extend: {
			colors: {
				// Brand colors read CSS variables set by `BrandProvider` (see global.css).
				...nativewindPrimaryColors,
				// Neutrals switch with the color scheme. `BrandProvider` injects the
				// active values from src/features/theme/theme-tokens.ts.
				background: themeVar('background'),
				card: themeVar('card'),
				foreground: themeVar('foreground'),
				muted: {
					DEFAULT: themeVar('muted'),
					foreground: themeVar('muted-foreground'),
				},
				border: themeVar('border'),
				// Slate steps without a semantic name (light = Tailwind slate).
				neutral: {
					300: themeVar('neutral-300'),
					400: themeVar('neutral-400'),
					600: themeVar('neutral-600'),
					700: themeVar('neutral-700'),
					800: themeVar('neutral-800'),
				},
				destructive: {
					DEFAULT: '#EF4444',
					foreground: '#FFFFFF',
				},
				success: {
					DEFAULT: '#10B981',
					foreground: '#FFFFFF',
				},
				warning: {
					DEFAULT: '#F59E0B',
					foreground: '#FFFFFF',
				},
			},
		},
	},
	plugins: [],
};
