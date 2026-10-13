import { hexToHslTriplet } from '../color.js';
import type { BrandTokens } from '../tokens.js';

export const BRAND_STYLE_ELEMENT_ID = 'vt-brand';
export const BRAND_STORAGE_KEY = 'virttend:branding';

/** Exact allowlist of shadcn variables the brand may write (spec D8). */
export const toShadcnVars = (t: BrandTokens): Record<string, string> => {
	const h = hexToHslTriplet;
	return {
		'--primary': h(t.primary),
		'--primary-foreground': h(t.onPrimary),
		'--ring': h(t.primary),
		'--accent': h(t.scale[50]),
		'--accent-foreground': h(t.scale[700]),
		'--sidebar-primary': h(t.primary),
		'--sidebar-primary-foreground': h(t.onPrimary),
		'--sidebar-accent': h(t.scale[50]),
		'--sidebar-accent-foreground': h(t.scale[700]),
		'--sidebar-ring': h(t.primary),
		'--chart-1': h(t.primary),
		'--chart-2': h(t.accent),
	};
};

/** Solo modo claro: `.dark` queda intacto (D8). */
export const brandStyleSheet = (t: BrandTokens): string =>
	`:root:not(.dark){${Object.entries(toShadcnVars(t))
		.map(([k, v]) => `${k}:${v};`)
		.join('')}}`;
