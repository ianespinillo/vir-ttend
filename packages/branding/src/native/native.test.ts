import { describe, expect, it } from 'vitest';
import { VIRTTEND_BRANDING } from '../defaults.js';
import { VIRTTEND_MARK } from '../marks/index.js';
import { deriveBrandTokens } from '../tokens.js';
import {
	NATIVE_DEFAULT_VARS,
	nativewindPrimaryColors,
	toNativeWindVars,
} from './index.js';

describe('toNativeWindVars', () => {
	it('returns 14 variables, all as "R G B"', () => {
		const vars = toNativeWindVars(
			deriveBrandTokens({ primary: '#023064', accent: '#0195EF' }),
		);
		expect(Object.keys(vars)).toHaveLength(14);
		for (const value of Object.values(vars)) {
			expect(value).toMatch(/^\d+ \d+ \d+$/);
		}
	});

	it('matches the Vir-ttend values', () => {
		expect(NATIVE_DEFAULT_VARS).toMatchInlineSnapshot(`
			{
			  "--brand-accent": "198 244 50",
			  "--brand-on-accent": "20 33 61",
			  "--brand-on-primary": "255 255 255",
			  "--brand-primary": "20 33 61",
			  "--brand-primary-100": "217 219 224",
			  "--brand-primary-200": "180 184 193",
			  "--brand-primary-300": "138 144 158",
			  "--brand-primary-400": "95 104 123",
			  "--brand-primary-50": "236 237 239",
			  "--brand-primary-500": "53 64 88",
			  "--brand-primary-600": "20 33 61",
			  "--brand-primary-700": "17 28 52",
			  "--brand-primary-800": "14 23 43",
			  "--brand-primary-900": "11 18 34",
			}
		`);
	});
});

describe('nativewindPrimaryColors', () => {
	it('references only variables that toNativeWindVars defines', () => {
		const defined = new Set(Object.keys(NATIVE_DEFAULT_VARS));
		const used =
			JSON.stringify(nativewindPrimaryColors).match(/--brand-[a-z0-9-]+/g) ?? [];
		expect(used.length).toBeGreaterThan(0);
		for (const name of used) expect(defined.has(name)).toBe(true);
	});

	it('keeps the alpha-value placeholder', () => {
		expect(nativewindPrimaryColors.primary.DEFAULT).toBe(
			'rgb(var(--brand-primary) / <alpha-value>)',
		);
	});
});

describe('VIRTTEND_MARK', () => {
	it('uses the Vir-ttend palette', () => {
		expect(VIRTTEND_MARK.background).toBe(VIRTTEND_BRANDING.colors.accent);
		expect(VIRTTEND_MARK.foreground).toBe(VIRTTEND_BRANDING.colors.primary);
		expect(VIRTTEND_MARK.viewBox).toBe('0 0 280 280');
	});
});
