import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { VIRTTEND_BRANDING, deriveBrandTokens } from '@repo/branding';
import { toShadcnDarkVars, toShadcnVars } from '@repo/branding/web';
import { describe, expect, it } from 'vitest';

const tokensCss = readFileSync(resolve(__dirname, '../tokens.css'), 'utf8');
const rootBlock = /:root\s*\{([^}]*)\}/.exec(tokensCss)?.[1] ?? '';
const darkBlock = /\.dark\s*\{([^}]*)\}/.exec(tokensCss)?.[1] ?? '';
const tokens = deriveBrandTokens(VIRTTEND_BRANDING.colors);
const expected = Object.entries(toShadcnVars(tokens));
const expectedDark = Object.entries(toShadcnDarkVars(tokens));

describe('tokens.css drift', () => {
	it('finds the :root block', () => {
		expect(rootBlock).not.toBe('');
	});

	it.each(expected)(
		'%s in :root matches the Vir-ttend default',
		(name, value) => {
			expect(rootBlock).toContain(`${name}: ${value};`);
		},
	);

	it('finds the .dark block', () => {
		expect(darkBlock).not.toBe('');
	});

	it.each(expectedDark)(
		'%s in .dark matches the Vir-ttend default',
		(name, value) => {
			expect(darkBlock).toContain(`${name}: ${value};`);
		},
	);
});
