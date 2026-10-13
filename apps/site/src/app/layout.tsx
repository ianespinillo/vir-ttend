import '@repo/ui/tokens.css';
import './globals.css';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { siteConfig } from '@/lib/site-config';
import { VIRTTEND_COLORS } from '@repo/branding';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({
	subsets: ['latin'],
	variable: '--font-inter',
	display: 'swap',
});

const title = 'Vir-ttend · Asistencia escolar simple, online y offline';

export const metadata: Metadata = {
	metadataBase: siteConfig.siteUrl ? new URL(siteConfig.siteUrl) : undefined,
	title: { default: title, template: '%s · Vir-ttend' },
	description: siteConfig.description,
	applicationName: siteConfig.name,
	openGraph: {
		type: 'website',
		locale: 'es_AR',
		siteName: siteConfig.name,
		title,
		description: siteConfig.description,
		url: '/',
	},
	twitter: {
		card: 'summary',
		title,
		description: siteConfig.description,
	},
};

export const viewport: Viewport = {
	themeColor: VIRTTEND_COLORS.navy,
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="es" className={inter.variable}>
			<body className="flex min-h-screen flex-col">
				<SiteHeader />
				<main className="flex-1">{children}</main>
				<SiteFooter />
			</body>
		</html>
	);
}
