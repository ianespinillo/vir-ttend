import type { Metadata } from 'next';
import { Providers } from './providers';
import '@repo/ui/globals.css';

export const metadata: Metadata = {
	title: 'Vir-ttend - Control de Asistencia Escolar',
	description:
		'Sistema integral de gestión de asistencia y alertas tempranas para colegios.',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="es">
			<body className="antialiased">
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
