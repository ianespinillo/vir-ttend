'use client';

import { AlertTriangle, Button, Shield } from '@repo/ui';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function ErrorComponent({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const router = useRouter();

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-background via-secondary/10 to-primary/10 p-4 relative overflow-hidden">
			{/* Decorative blur rings */}
			<div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
			<div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-destructive/5 rounded-full blur-[120px] pointer-events-none" />

			<div className="w-full max-w-md bg-card/90 backdrop-blur-lg border border-border p-8 rounded-3xl shadow-xl flex flex-col gap-6 relative z-10 text-center">
				{/* Brand logo & header */}
				<div className="flex flex-col items-center gap-2">
					<div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center shadow-lg shadow-destructive/10 mb-2 border border-destructive/20 animate-pulse">
						<AlertTriangle className="h-8 w-8 text-destructive" />
					</div>
					<h2 className="text-2xl font-black tracking-tight text-foreground">
						Algo salió mal
					</h2>
					<p className="text-sm text-muted-foreground font-medium">
						Se ha producido un error inesperado al procesar la solicitud.
					</p>
				</div>

				{/* Error description if available */}
				{error && (
					<div className="bg-muted p-4 rounded-2xl text-left border border-border/80 max-h-36 overflow-y-auto custom-scroll">
						<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
							Detalles del Error
						</p>
						<code className="text-xs text-destructive font-mono break-all">
							{error.message || 'Error desconocido del sistema.'}
						</code>
					</div>
				)}

				{/* Actions */}
				<div className="flex flex-col gap-2.5">
					<Button
						onClick={() => reset()}
						className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-3 rounded-xl shadow-md shadow-primary/15 transition-all h-11"
					>
						Reintentar Operación
					</Button>
					<Button
						variant="outline"
						onClick={() => router.push('/dashboard')}
						className="w-full rounded-xl border border-border h-11"
					>
						Volver al Dashboard
					</Button>
				</div>

				<div className="flex items-center justify-center gap-2 border-t border-border/50 pt-5 text-[10px] text-muted-foreground font-medium">
					<Shield className="h-3.5 w-3.5 text-primary" />
					<span>Código de rastreo: {error?.digest || 'N/D'}</span>
				</div>
			</div>
		</div>
	);
}
