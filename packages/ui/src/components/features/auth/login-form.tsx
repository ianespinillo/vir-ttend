'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type LoginFormValues, loginSchema } from '@repo/common';
import { Loader2, LogIn } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '../../../ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../../../ui/form';
import { Input } from '../../../ui/input';
import { PasswordInput } from './password-input';

export interface LoginFormProps {
	onSubmit: (values: LoginFormValues) => void;
	isLoading?: boolean;
	errorMessage?: string | null;
	/** Shows the "¿Olvidaste tu contraseña?" link when provided. */
	onForgotPassword?: () => void;
}

export function LoginForm({
	onSubmit,
	isLoading = false,
	errorMessage,
	onForgotPassword,
}: LoginFormProps) {
	const form = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: '',
			password: '',
		},
	});

	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h2 className="text-xl font-bold tracking-tight">Iniciar Sesión</h2>
				<p className="text-sm text-muted-foreground">
					Ingresa tus credenciales para acceder a la plataforma
				</p>
			</div>

			{errorMessage && (
				<div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
					{errorMessage}
				</div>
			)}

			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="space-y-4"
					noValidate
				>
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Correo Electrónico</FormLabel>
								<FormControl>
									<Input
										type="email"
										placeholder="nombre@colegio.edu.ar"
										disabled={isLoading}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<div className="flex items-center justify-between">
									<FormLabel>Contraseña</FormLabel>
									{onForgotPassword && (
										<button
											type="button"
											onClick={onForgotPassword}
											className="text-xs font-medium text-primary underline-offset-4 hover:underline"
										>
											¿Olvidaste tu contraseña?
										</button>
									)}
								</div>
								<FormControl>
									<PasswordInput
										placeholder="••••••••"
										disabled={isLoading}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button type="submit" className="w-full gap-2" disabled={isLoading}>
						{isLoading ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								<span>Iniciando sesión…</span>
							</>
						) : (
							<>
								<LogIn className="h-4 w-4" />
								<span>Ingresar</span>
							</>
						)}
					</Button>
				</form>
			</Form>
		</div>
	);
}
