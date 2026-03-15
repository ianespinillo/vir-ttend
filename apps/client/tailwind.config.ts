import uiConfig from '@repo/ui/tailwind.config';
import type { Config } from 'tailwindcss';

const config: Config = {
	...uiConfig,
	content: [
		...(uiConfig.content as string[]),
		'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		...uiConfig.theme,
		extend: {
			...uiConfig.theme?.extend,
			colors: {
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
			},
		},
	},
	plugins: [...(uiConfig.plugins ?? []), require('tailwindcss-animate')],
};

export default config;
