import { AuthProvider } from '@/lib/auth/provider';
import { TanstackProvider } from '@repo/hooks';
import { BrandProvider } from '@repo/ui';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Toaster } from 'sonner';
import '@repo/ui/tokens.css';
import './globals.css';

const geistSans = localFont({
	src: './fonts/GeistVF.woff',
	variable: '--font-geist-sans',
	weight: '100 900',
});
const geistMono = localFont({
	src: './fonts/GeistMonoVF.woff',
	variable: '--font-geist-mono',
	weight: '100 900',
});

export function generateMetadata(): Metadata {
	const tenancyMode =
		process.env.NEXT_PUBLIC_TENANCY_MODE || process.env.TENANCY_MODE || 'multi';
	const isSingle = tenancyMode === 'single';
	const schoolShortName = (
		process.env.NEXT_PUBLIC_SCHOOL_SHORT_NAME ||
		process.env.SCHOOL_SHORT_NAME ||
		process.env.TENANT_NAME
	)?.trim();
	const brandingSlug = (
		process.env.NEXT_PUBLIC_BRANDING_SLUG || process.env.BRANDING_SLUG
	)?.trim();

	const title =
		isSingle && schoolShortName ? `Virttend | ${schoolShortName}` : 'Virttend';

	const iconUrl =
		isSingle && brandingSlug ? '/branding/favicon.ico' : '/icon.svg';

	return {
		title,
		description: 'Gestión de asistencia escolar',
		icons: {
			icon: iconUrl,
			shortcut: iconUrl,
			apple: iconUrl,
		},
	};
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="es">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<TanstackProvider>
					<BrandProvider>
						<AuthProvider>
							{children}
							<Toaster richColors position="top-right" />
						</AuthProvider>
					</BrandProvider>
				</TanstackProvider>
			</body>
		</html>
	);
}
