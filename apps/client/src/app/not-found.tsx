import { Button } from '@repo/ui';
import Link from 'next/link';

export default function NotFound() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
			<p className="text-6xl font-semibold text-foreground">404</p>
			<h1 className="text-xl font-semibold">Página no encontrada</h1>
			<p className="text-sm text-muted-foreground">
				La página que buscás no existe o fue movida.
			</p>
			<Button asChild>
				<Link href="/">Volver al inicio</Link>
			</Button>
		</div>
	);
}
