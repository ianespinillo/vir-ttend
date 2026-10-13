import { describe, expect, it } from 'vitest';
import { VIRTTEND_BRANDING } from './defaults.js';
import { SCALE, deriveBrandTokens } from './tokens.js';

describe('deriveBrandTokens', () => {
	it('uses white text on a dark primary', () => {
		const t = deriveBrandTokens({ primary: '#023064' });
		expect(t.onPrimary).toBe('#FFFFFF');
		expect(t.usable).toBe(true);
	});

	it('uses the ink color on a light primary', () => {
		const t = deriveBrandTokens({ primary: '#F9D648' });
		expect(t.onPrimary).toBe('#14213D');
		expect(t.usable).toBe(true);
	});

	it('falls back to Vir-ttend tokens when contrast is insufficient', () => {
		const t = deriveBrandTokens({ primary: '#808080' });
		const virttend = deriveBrandTokens(VIRTTEND_BRANDING.colors);
		expect(t.usable).toBe(false);
		expect({ ...t, usable: true }).toEqual(virttend);
	});

	it('keeps the exact primary at step 600 and builds the whole scale', () => {
		const t = deriveBrandTokens({ primary: '#023064' });
		expect(t.scale[600]).toBe(t.primary);
		expect(Object.keys(t.scale).map(Number)).toEqual([...SCALE]);
	});

	it('defaults the accent to scale 400 and normalizes casing', () => {
		const t = deriveBrandTokens({ primary: '#023064' });
		expect(t.accent).toBe(t.scale[400]);
		expect(
			deriveBrandTokens({ primary: '#023064', accent: '#0195ef' }).accent,
		).toBe('#0195EF');
	});
});
