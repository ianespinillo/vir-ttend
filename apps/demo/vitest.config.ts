import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			// Point @repo/common at its source so tests type-check the real
			// contracts without needing the built dist to be refreshed.
			'@repo/common': fileURLToPath(
				new URL('../../packages/common/src/index.ts', import.meta.url),
			),
		},
	},
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts'],
	},
});
