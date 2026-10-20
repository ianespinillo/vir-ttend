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
		'--primary-ink': h(t.primary),
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

/**
 * Dark-mode brand variables. Surfaces keep the exact brand primary; text,
 * icons and chart marks (`--primary-ink`, `--chart-1`) and focus rings use
 * lighter steps of the same scale so they stay legible on dark neutrals.
 * Neutral and hover variables (`--accent`, `--sidebar-accent`) are never
 * written: they belong to the `.dark` block of `tokens.css`.
 */
export const toShadcnDarkVars = (t: BrandTokens): Record<string, string> => {
	const h = hexToHslTriplet;
	return {
		'--primary': h(t.primary),
		'--primary-foreground': h(t.onPrimary),
		'--primary-ink': h(t.scale[200]),
		'--ring': h(t.scale[300]),
		'--sidebar-primary': h(t.primary),
		'--sidebar-primary-foreground': h(t.onPrimary),
		'--sidebar-ring': h(t.scale[300]),
		'--chart-1': h(t.scale[200]),
		'--chart-2': h(t.accent),
	};
};

const block = (selector: string, vars: Record<string, string>) =>
	`${selector}{${Object.entries(vars)
		.map(([k, v]) => `${k}:${v};`)
		.join('')}}`;

export const brandStyleSheet = (t: BrandTokens): string =>
	block(':root:not(.dark)', toShadcnVars(t)) +
	block('.dark', toShadcnDarkVars(t));
