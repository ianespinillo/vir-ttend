import { AUTH_ROUTES } from '@repo/common/routes';
import {
	type ForgotPasswordInput,
	type ResetPasswordInput,
	forgotPasswordSchema,
	resetPasswordSchema,
} from '@repo/common/schemas';
import axios from 'axios';
import { api } from '../../services/api';

export type ResetPasswordField = keyof ResetPasswordInput;
export type ResetPasswordFieldErrors = Partial<
	Record<ResetPasswordField, string>
>;

const OFFLINE_MESSAGE =
	'No hay conexión con el servidor. Revisá tu internet e intentá nuevamente.';
const FALLBACK_MESSAGE =
	'No se pudo completar la operación. Intentá nuevamente.';

/** Shared web schema: the email error, or `null` when valid. */
export const validateForgotPassword = (
	input: ForgotPasswordInput,
): string | null => {
	const result = forgotPasswordSchema.safeParse(input);
	return result.success ? null : (result.error.issues[0]?.message ?? null);
};

/** Shared web schema: first error message per field, `{}` when valid. */
export const validateResetPassword = (
	input: ResetPasswordInput,
): ResetPasswordFieldErrors => {
	const result = resetPasswordSchema.safeParse(input);
	if (result.success) return {};
	const errors: ResetPasswordFieldErrors = {};
	for (const issue of result.error.issues) {
		const field = issue.path[0] as ResetPasswordField | undefined;
		if (field && !errors[field]) errors[field] = issue.message;
	}
	return errors;
};

/** `POST /auth/forgot-password`. Resolves the same whether or not the email exists. */
export const requestPasswordReset = async (email: string): Promise<void> => {
	await api.post(AUTH_ROUTES.forgotPassword, {
		email: email.trim().toLowerCase(),
	});
};

/** `POST /auth/reset-password` with the emailed code. */
export const confirmPasswordReset = async (
	input: ResetPasswordInput,
): Promise<void> => {
	await api.post(AUTH_ROUTES.resetPassword, {
		...input,
		email: input.email.trim().toLowerCase(),
		code: input.code.trim(),
	});
};

/** Server message when there is one, a Spanish fallback otherwise. */
export const getForgotPasswordErrorMessage = (error: unknown): string => {
	if (axios.isAxiosError(error)) {
		if (!error.response) return OFFLINE_MESSAGE;
		const message = (
			error.response.data as { message?: string | string[] } | undefined
		)?.message;
		if (Array.isArray(message) && message.length > 0) return message.join(', ');
		if (typeof message === 'string' && message.trim()) return message;
	}
	return FALLBACK_MESSAGE;
};
