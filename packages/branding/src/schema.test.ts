import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { VIRTTEND_BRANDING } from './defaults.js';
import {
	brandingFileSchema,
	formatBrandingError,
	publicBrandingSchema,
} from './schema.js';

const here = dirname(fileURLToPath(import.meta.url));
const eest3 = resolve(here, '../../../deploy/branding/eest3/branding.json');

describe('brandingFileSchema', () => {
	it('accepts deploy/branding/eest3/branding.json', () => {
		const json = JSON.parse(readFileSync(eest3, 'utf8'));
		const parsed = brandingFileSchema.safeParse(json);
		expect(parsed.success).toBe(true);
		if (parsed.success) expect(parsed.data.colors.primary).toBe('#023064');
	});

	it('rejects an invalid color naming the field', () => {
		const parsed = brandingFileSchema.safeParse({
			version: 1,
			displayName: 'X',
			shortName: 'X',
			colors: { primary: 'azul' },
		});
		expect(parsed.success).toBe(false);
		if (!parsed.success)
			expect(formatBrandingError(parsed.error)).toContain('colors.primary');
	});

	it('defaults assets to an empty object', () => {
		const parsed = brandingFileSchema.parse({
			version: 1,
			displayName: 'X',
			shortName: 'X',
			colors: { primary: '#023064' },
		});
		expect(parsed.assets).toEqual({});
	});

	it('rejects asset names with path traversal', () => {
		const parsed = brandingFileSchema.safeParse({
			version: 1,
			displayName: 'X',
			shortName: 'X',
			colors: { primary: '#023064' },
			assets: { crest: '../secret.png' },
		});
		expect(parsed.success).toBe(false);
	});
});

describe('publicBrandingSchema', () => {
	it('accepts the Vir-ttend default', () => {
		expect(publicBrandingSchema.safeParse(VIRTTEND_BRANDING).success).toBe(true);
	});
});
