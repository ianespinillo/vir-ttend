'use client';

import { AlertCircle, BookOpen, Button, Input, Label, Shield } from '@repo/ui';
import React from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
	const { login, isLoggingIn, loginError } = useAuth();
	const [email, setEmail] = React.useState('a.spinillo@colegio.edu.ar');
	const [password, setPassword] = React.useState('********');
	const [error, setError] = React.useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		if (!email) {
			setError('El correo electrónico es requerido.');
			return;
		}
		try {
			await login({ email });
		} catch (err) {
			const msg =
				err instanceof Error
					? err.message
					: 'Error al iniciar sesión. Inténtelo de nuevo.';
			setError(msg);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-background via-secondary/10 to-primary/10 p-4 relative overflow-hidden">
			{/* Decorative blur rings */}
			<div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
			<div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/15 rounded-full blur-[120px] pointer-events-none" />

			<div className="w-full max-w-md bg-card/75 backdrop-blur-lg border border-border p-8 rounded-3xl shadow-xl flex flex-col gap-6 relative z-10 transition-all duration-300 hover:shadow-2xl">
				{/* Brand logo & header */}
				<div className="flex flex-col items-center gap-2 text-center">
					<div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25 mb-2">
						<BookOpen className="h-7 w-7 text-primary-foreground" />
					</div>
					<h2 className="text-2xl font-black tracking-tight text-foreground">
						Acceso Institucional
					</h2>
					<p className="text-sm text-muted-foreground font-medium">
						Vir-ttend · Gestión de Asistencia Escolar
					</p>
				</div>

				{/* Error Alerts */}
				{(error || loginError) && (
					<div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-2xl flex items-center gap-2.5 font-medium animate-pulse">
						<AlertCircle className="h-5 w-5 flex-shrink-0" />
						<span>{error || 'Error de credenciales.'}</span>
					</div>
				)}

				{/* Form */}
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<Label
							htmlFor="email"
							className="font-semibold text-xs text-muted-foreground uppercase tracking-wider ml-1"
						>
							Correo Electrónico
						</Label>
						<Input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="ejemplo@colegio.edu.ar"
							className="rounded-xl border border-border/80 focus-visible:ring-primary h-11"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label
							htmlFor="password"
							className="font-semibold text-xs text-muted-foreground uppercase tracking-wider ml-1"
						>
							Contraseña
						</Label>
						<Input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="rounded-xl border border-border/80 focus-visible:ring-primary h-11"
						/>
					</div>

					<Button
						type="submit"
						disabled={isLoggingIn}
						className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-3 rounded-xl shadow-md shadow-primary/15 transition-all duration-200 mt-2 h-11"
					>
						{isLoggingIn ? 'Iniciando Sesión...' : 'Ingresar al Portal'}
					</Button>
				</form>

				<div className="flex items-center justify-center gap-2 border-t border-border/50 pt-5 text-xs text-muted-foreground font-medium">
					<Shield className="h-4 w-4 text-primary" />
					<span>Conexión segura SSL certificada</span>
				</div>
			</div>
		</div>
	);
}
