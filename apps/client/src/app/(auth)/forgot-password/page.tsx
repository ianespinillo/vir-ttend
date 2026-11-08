'use client';

import type { ErrorResponse } from '@repo/common';
import { useRequestPasswordReset, useResetPassword } from '@repo/hooks';
import { ForgotPasswordForm } from '@repo/ui';
import { useRouter, useSearchParams } from 'next/navigation';

/** Turns an API error into an Error carrying the server's Spanish message. */
function toUserError(err: unknown, fallback: string): Error {
	const axiosError = err as {
		isAxiosError?: boolean;
		response?: { data?: Partial<ErrorResponse> };
	} | null;
	if (axiosError?.isAxiosError && !axiosError.response) {
		return new Error('No hay conexión con el servidor. Intentá nuevamente.');
	}
	const message = axiosError?.response?.data?.message;
	if (Array.isArray(message) && message.length > 0) {
		return new Error(message.join(', '));
	}
	if (typeof message === 'string' && message.trim()) return new Error(message);
	return new Error(fallback);
}

export default function ForgotPasswordPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const requestReset = useRequestPasswordReset();
	const resetPassword = useResetPassword();

	return (
		<ForgotPasswordForm
			initialEmail={searchParams.get('email') ?? ''}
			onRequestCode={async (values) => {
				try {
					await requestReset.mutateAsync(values);
				} catch (err) {
					throw toUserError(err, 'No se pudo enviar el código.');
				}
			}}
			onResetPassword={async (values) => {
				try {
					await resetPassword.mutateAsync(values);
				} catch (err) {
					throw toUserError(err, 'No se pudo restablecer la contraseña.');
				}
			}}
			onBackToLogin={() => router.push('/login')}
		/>
	);
}
