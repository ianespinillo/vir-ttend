import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
	transpilePackages: ['@repo/ui', '@repo/common'],
	turbopack: {
		root: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'),
	},
	output: 'standalone',
	devIndicators: false,
	// The demo data layer (lib/store + lib/session) uses NodeNext-style
	// extensioned relative imports ("./types.js" -> types.ts) so that vitest
	// and tsc resolve them the same way. The build runs webpack (see the
	// package.json "build" script: `next build --webpack`) because Turbopack
	// does not map ".js" to ".ts"; webpack needs this alias to find the
	// underlying TypeScript sources.
	webpack: (config) => {
		config.resolve.extensionAlias = {
			'.js': ['.ts', '.tsx', '.js'],
			'.mjs': ['.mts', '.mjs'],
			'.cjs': ['.cts', '.cjs'],
		};
		return config;
	},
};

export default nextConfig;
