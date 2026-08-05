import { AuthProvider } from '@/lib/auth/provider';
import { TanstackProvider } from '@repo/hooks';
import { Toaster } from '@repo/ui';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
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

export const metadata: Metadata = {
	title: 'Vir-ttend',
	description: 'Gestión de asistencia escolar',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="es">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<TanstackProvider>
					<AuthProvider>
						{children}
						<Toaster richColors position="top-right" />
					</AuthProvider>
				</TanstackProvider>
			</body>
		</html>
	);
}
