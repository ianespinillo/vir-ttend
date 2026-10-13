import uiConfig from '@repo/ui/tailwind.config';
import type { Config } from 'tailwindcss';

const config: Config = {
	presets: [uiConfig],
	// Only the site sources: the UI preset also scans packages/ui, which this
	// app does not import at runtime.
	content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
	theme: {
		extend: {
			colors: {
				brand: {
					// Vir-ttend lime (the `--chart-2` token). It is a background color:
					// pair it with navy text, and use it as text only on navy surfaces.
					lime: 'hsl(var(--chart-2) / <alpha-value>)',
				},
			},
		},
	},
};

export default config;
