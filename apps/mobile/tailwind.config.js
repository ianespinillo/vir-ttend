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
				primary: {
					DEFAULT: '#4F46E5',
					foreground: '#FFFFFF',
					50: '#EEF2FF',
					100: '#E0E7FF',
					500: '#6366F1',
					600: '#4F46E5',
					700: '#4338CA',
				},
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
