import './globals.css';

import { DemoProvider } from '@/lib/session/demo-provider';
import { Toaster } from '@repo/ui';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Vir-ttend · Demo',
	description: 'Demo de ventas — gestión de asistencia escolar',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="es" className="scroll-smooth">
			<body>
				<DemoProvider>
					<div className="min-h-screen">{children}</div>
					<Toaster richColors position="top-right" />
				</DemoProvider>
			</body>
		</html>
	);
}
