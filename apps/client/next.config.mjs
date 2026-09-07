import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
	transpilePackages: ['@repo/ui', '@repo/common', '@repo/hooks'],
	turbopack: {
		root: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'),
	},
	output: 'standalone',
	devIndicators: false,
};

export default nextConfig;
