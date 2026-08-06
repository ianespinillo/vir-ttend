'use client';

import { School } from 'lucide-react';
import type { ReactNode } from 'react';

export interface AuthLayoutProps {
	children: ReactNode;
	title?: string;
	subtitle?: string;
}

export function AuthLayout({
	children,
	title = 'Vir-ttend',
	subtitle = 'Sistema Integrado de Gestión Escolar',
}: AuthLayoutProps) {
	return (
		<div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
			<div className="w-full max-w-md space-y-6">
				<div className="flex flex-col items-center text-center space-y-2">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
						<School className="h-6 w-6" />
					</div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground">
						{title}
					</h1>
					<p className="text-sm text-muted-foreground">{subtitle}</p>
				</div>
				<div className="rounded-xl border bg-card text-card-foreground shadow-xl p-6 sm:p-8">
					{children}
				</div>
				<div className="text-center text-xs text-muted-foreground">
					&copy; {new Date().getFullYear()} Vir-ttend. Todos los derechos reservados.
				</div>
			</div>
		</div>
	);
}
