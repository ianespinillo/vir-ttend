import { defineConfig } from 'tsup';

export default defineConfig({
	entry: [
		'src/index.ts',
		'src/types/index.ts',
		'src/constants/index.ts',
		'src/routes/index.ts',
		'src/dto/index.ts',
	],
	format: ['cjs', 'esm'],
	dts: true,
	sourcemap: true,
	clean: true,
	target: 'es2020',
});
