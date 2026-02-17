/** @type {import('next').NextConfig} */
const nextConfig = {
	transpilePackages: ['@repo/ui', '@repo/common', '@repo/hooks'],
};

export default nextConfig;
