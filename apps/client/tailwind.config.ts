import uiConfig from '@repo/ui/tailwind.config';
import type { Config } from 'tailwindcss';

const config: Config = {
	presets: [uiConfig],
	content: [
		'./src/**/*.{js,ts,jsx,tsx,mdx}',
		'../../packages/ui/src/**/*.{ts,tsx}',
	],
};

export default config;
