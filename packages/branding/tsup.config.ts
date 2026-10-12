import { defineConfig } from 'tsup';

export default defineConfig({
	entry: [
		'src/index.ts',
		'src/web/index.ts',
		'src/native/index.ts',
		'src/marks/index.ts',
	],
	format: ['cjs', 'esm'],
	dts: true,
	sourcemap: true,
	clean: true,
	target: 'es2020',
});
