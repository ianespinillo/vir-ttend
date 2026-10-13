import { describe, expect, it } from 'vitest';
import { VIRTTEND_BRANDING } from '../defaults.js';
import { deriveBrandTokens } from '../tokens.js';
import {
	BRAND_STORAGE_KEY,
	BRAND_STYLE_ELEMENT_ID,
	brandStyleSheet,
	toShadcnVars,
} from './index.js';

const tokens = deriveBrandTokens(VIRTTEND_BRANDING.colors);

const ALLOWLIST = [
	'--primary',
	'--primary-foreground',
	'--ring',
	'--accent',
	'--accent-foreground',
	'--sidebar-primary',
	'--sidebar-primary-foreground',
	'--sidebar-accent',
	'--sidebar-accent-foreground',
	'--sidebar-ring',
	'--chart-1',
	'--chart-2',
];

describe('toShadcnVars', () => {
	it('returns exactly the 12 allowlisted variables', () => {
		const vars = toShadcnVars(tokens);
		expect(Object.keys(vars).sort()).toEqual([...ALLOWLIST].sort());
		expect(vars).not.toHaveProperty('--background');
		expect(vars).not.toHaveProperty('--destructive');
	});

	it('matches the Vir-ttend values', () => {
		expect(toShadcnVars(tokens)).toMatchInlineSnapshot(`
			{
			  "--accent": "220 8.6% 93.1%",
			  "--accent-foreground": "221.1 50.7% 13.5%",
			  "--chart-1": "221 50.6% 15.9%",
			  "--chart-2": "74.2 89.8% 57.6%",
			  "--primary": "221 50.6% 15.9%",
			  "--primary-foreground": "0 0% 100%",
			  "--ring": "221 50.6% 15.9%",
			  "--sidebar-accent": "220 8.6% 93.1%",
			  "--sidebar-accent-foreground": "221.1 50.7% 13.5%",
			  "--sidebar-primary": "221 50.6% 15.9%",
			  "--sidebar-primary-foreground": "0 0% 100%",
			  "--sidebar-ring": "221 50.6% 15.9%",
			}
		`);
	});
});

describe('brandStyleSheet', () => {
	it('only targets light mode', () => {
		const css = brandStyleSheet(tokens);
		expect(css.startsWith(':root:not(.dark){')).toBe(true);
		expect(css.endsWith('}')).toBe(true);
		expect(css).toContain('--primary:');
	});
});

describe('constants', () => {
	it('exposes the stable ids', () => {
		expect(BRAND_STYLE_ELEMENT_ID).toBe('vt-brand');
		expect(BRAND_STORAGE_KEY).toBe('virttend:branding');
	});
});
