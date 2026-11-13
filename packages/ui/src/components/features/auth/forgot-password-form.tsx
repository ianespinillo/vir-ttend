'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
	type ForgotPasswordInput,
	type ResetPasswordInput,
	forgotPasswordSchema,
	resetPasswordSchema,
} from '@repo/common';
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Mail } from 'lucide-react';
import { useState } from 'react';
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

export interface ForgotPasswordFormProps {
	/** Emails a code. Reject with a user-facing message on failure. */
	onRequestCode: (values: ForgotPasswordInput) => Promise<void>;
	/** Sets the new password. Reject with a user-facing message on failure. */
	onResetPassword: (values: ResetPasswordInput) => Promise<void>;
	onBackToLogin: () => void;
	initialEmail?: string;
}

type Step = 'request' | 'reset' | 'done';

const messageOf = (error: unknown, fallback: string): string =>
	error instanceof Error && error.message ? error.message : fallback;

/**
 * Self-service password recovery in two steps: ask for a 6-digit code by
 * email, then enter it with the new password.
 */
export function ForgotPasswordForm({
	onRequestCode,
	onResetPassword,
	onBackToLogin,
	initialEmail = '',
}: Readonly<ForgotPasswordFormProps>) {
	const [step, setStep] = useState<Step>('request');
	const [email, setEmail] = useState(initialEmail);
	const [error, setError] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const [isResending, setIsResending] = useState(false);

	const requestForm = useForm<ForgotPasswordInput>({
		resolver: zodResolver(forgotPasswordSchema),
		defaultValues: { email: initialEmail },
	});

	const resetForm = useForm<ResetPasswordInput>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: {
			email: initialEmail,
			code: '',
			newPassword: '',
			confirmNewPassword: '',
		},
	});

	const handleRequest = async (values: ForgotPasswordInput) => {
		setError(null);
		try {
			await onRequestCode(values);
			setEmail(values.email);
			resetForm.setValue('email', values.email);
			setNotice(null);
			setStep('reset');
		} catch (err) {
			setError(messageOf(err, 'No se pudo enviar el código. Intentá nuevamente.'));
		}
	};

	const handleResend = async () => {
		setError(null);
		setNotice(null);
		setIsResending(true);
		try {
			await onRequestCode({ email });
			setNotice('Si pasó más de un minuto, te enviamos un código nuevo.');
		} catch (err) {
			setError(messageOf(err, 'No se pudo reenviar el código.'));
		} finally {
			setIsResending(false);
		}
	};

	const handleReset = async (values: ResetPasswordInput) => {
		setError(null);
		try {
			await onResetPassword(values);
			setStep('done');
		} catch (err) {
			setError(
				messageOf(err, 'No se pudo restablecer la contraseña. Intentá nuevamente.'),
			);
		}
	};

	if (step === 'done') {
		return (
			<div className="space-y-6 text-center">
				<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
					<CheckCircle2 className="h-6 w-6" />
				</div>
				<div className="space-y-1">
					<h2 className="text-xl font-bold tracking-tight">
						Contraseña actualizada
					</h2>
					<p className="text-sm text-muted-foreground">
						Ya podés iniciar sesión con tu nueva contraseña. Cerramos las sesiones que
						tenías abiertas en otros dispositivos.
					</p>
				</div>
				<Button className="w-full" onClick={onBackToLogin}>
					Ir a iniciar sesión
				</Button>
			</div>
		);
	}

	const isRequesting = requestForm.formState.isSubmitting;
	const isResetting = resetForm.formState.isSubmitting;

	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h2 className="text-xl font-bold tracking-tight">
					{step === 'request' ? 'Recuperar contraseña' : 'Ingresá el código'}
				</h2>
				<p className="text-sm text-muted-foreground">
					{step === 'request' ? (
						'Te enviaremos un código de 6 dígitos a tu correo para que definas una contraseña nueva.'
					) : (
						<>
							Si <span className="font-medium text-foreground">{email}</span> tiene una
							cuenta, le enviamos un código. Vence en 15 minutos.
						</>
					)}
				</p>
			</div>

			{error && (
				<div
					aria-live="assertive"
					className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive"
				>
					{error}
				</div>
			)}
			{notice && (
				<div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">
					{notice}
				</div>
			)}

			{step === 'request' ? (
				<Form key="request" {...requestForm}>
					<form
						onSubmit={requestForm.handleSubmit(handleRequest)}
						className="space-y-4"
						noValidate
					>
						<FormField
							control={requestForm.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Correo Electrónico</FormLabel>
									<FormControl>
										<Input
											type="email"
											autoComplete="email"
											placeholder="nombre@colegio.edu.ar"
											disabled={isRequesting}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit" className="w-full gap-2" disabled={isRequesting}>
							{isRequesting ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Mail className="h-4 w-4" />
							)}
							<span>Enviar código</span>
						</Button>
					</form>
				</Form>
			) : (
				<Form key="reset" {...resetForm}>
					<form
						onSubmit={resetForm.handleSubmit(handleReset)}
						className="space-y-4"
						noValidate
					>
						<FormField
							control={resetForm.control}
							name="code"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Código</FormLabel>
									<FormControl>
										<Input
											inputMode="numeric"
											autoComplete="one-time-code"
											maxLength={6}
											placeholder="000000"
											className="font-mono tracking-[0.4em]"
											disabled={isResetting}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={resetForm.control}
							name="newPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Nueva contraseña</FormLabel>
									<FormControl>
										<PasswordInput
											autoComplete="new-password"
											placeholder="Mínimo 8 caracteres"
											disabled={isResetting}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={resetForm.control}
							name="confirmNewPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Confirmar contraseña</FormLabel>
									<FormControl>
										<PasswordInput
											autoComplete="new-password"
											placeholder="Repetí la nueva contraseña"
											disabled={isResetting}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<p className="text-xs text-muted-foreground">
							Usá al menos 8 caracteres con una mayúscula, una minúscula, un número y
							un carácter especial (@$!%*?&).
						</p>
						<Button type="submit" className="w-full gap-2" disabled={isResetting}>
							{isResetting ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<KeyRound className="h-4 w-4" />
							)}
							<span>Cambiar contraseña</span>
						</Button>
						<div className="flex items-center justify-between text-xs">
							<button
								type="button"
								className="text-muted-foreground underline-offset-4 hover:underline"
								onClick={() => {
									setError(null);
									setNotice(null);
									setStep('request');
								}}
							>
								Usar otro correo
							</button>
							<button
								type="button"
								className="font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
								disabled={isResending}
								onClick={handleResend}
							>
								{isResending ? 'Reenviando…' : 'Reenviar código'}
							</button>
						</div>
					</form>
				</Form>
			)}

			<button
				type="button"
				onClick={onBackToLogin}
				className="flex w-full items-center justify-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
			>
				<ArrowLeft className="h-4 w-4" />
				Volver a iniciar sesión
			</button>
		</div>
	);
}
