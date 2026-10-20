import '@repo/ui/tokens.css';
import './globals.css';

import { ThemedToaster } from '@/components/themed-toaster';
import { DemoProvider } from '@/lib/session/demo-provider';
import { ThemeProvider, ThemeScript } from '@repo/ui';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Vir-ttend · Demo',
	description:
		'Demo interactiva de Vir-ttend con datos ficticios: asistencia escolar, alertas y reportes.',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="es" className="scroll-smooth" suppressHydrationWarning>
			<head>
				<ThemeScript />
			</head>
			<body>
				<ThemeProvider>
					<DemoProvider>
						<div className="min-h-screen">{children}</div>
						<ThemedToaster richColors position="top-right" />
					</DemoProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
