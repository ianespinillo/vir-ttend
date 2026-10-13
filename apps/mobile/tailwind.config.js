const { nativewindPrimaryColors } = require('@repo/branding/native');

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./app/**/*.{js,jsx,ts,tsx}',
		'./components/**/*.{js,jsx,ts,tsx}',
		'./src/**/*.{js,jsx,ts,tsx}',
	],
	presets: [require('nativewind/preset')],
	theme: {
		extend: {
			colors: {
				// Brand colors read CSS variables set by `BrandProvider` (see global.css).
				...nativewindPrimaryColors,
				background: '#F8FAFC',
				card: '#FFFFFF',
				foreground: '#0F172A',
				muted: {
					DEFAULT: '#F1F5F9',
					foreground: '#64748B',
				},
				border: '#E2E8F0',
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
