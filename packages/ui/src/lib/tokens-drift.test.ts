import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { VIRTTEND_BRANDING, deriveBrandTokens } from '@repo/branding';
import { toShadcnVars } from '@repo/branding/web';
import { describe, expect, it } from 'vitest';

const tokensCss = readFileSync(resolve(__dirname, '../tokens.css'), 'utf8');
const rootBlock = /:root\s*\{([^}]*)\}/.exec(tokensCss)?.[1] ?? '';
const expected = Object.entries(
	toShadcnVars(deriveBrandTokens(VIRTTEND_BRANDING.colors)),
);

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
});
