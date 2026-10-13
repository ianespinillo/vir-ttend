import { describe, expect, it } from 'vitest';
import { VIRTTEND_BRANDING } from './defaults.js';
import { resolveBranding } from './resolve.js';
import type { BrandingFile } from './schema.js';

const file: BrandingFile = {
	version: 1,
	displayName: 'Escuela Uno',
	shortName: 'E1',
	colors: { primary: '#023064', accent: '#0195EF' },
	assets: { crestSmall: 'crest-small.svg', favicon: 'favicon.ico' },
};

describe('resolveBranding', () => {
	it('returns Vir-ttend in multi even with an instance', () => {
		const b = resolveBranding({
			mode: 'multi',
			instance: { file, version: 'abc' },
		});
		expect(b.source).toBe('virttend');
		expect(b).toBe(VIRTTEND_BRANDING);
	});

	it('returns Vir-ttend in single without an instance', () => {
		expect(resolveBranding({ mode: 'single', instance: null })).toBe(
			VIRTTEND_BRANDING,
		);
	});

	it('builds the instance branding in single with versioned URLs', () => {
		const b = resolveBranding({
			mode: 'single',
			instance: { file, version: 'abc123' },
		});
		expect(b.source).toBe('instance');
		expect(b.showPoweredBy).toBe(true);
		expect(b.displayName).toBe('Escuela Uno');
		expect(b.colors).toEqual({
			primary: '#023064',
			accent: '#0195EF',
			highlight: null,
		});
		expect(b.assets).toEqual({
			crest: null,
			crestSmall: '/branding/crest-small.svg?v=abc123',
			crestSmallPng: null,
			favicon: '/branding/favicon.ico?v=abc123',
		});
	});
});
