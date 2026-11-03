import { USER_ROUTES } from '@repo/common/routes';
import {
	type ChangePasswordInput,
	changePasswordSchema,
} from '@repo/common/schemas';
import axios from 'axios';
import { api } from '../../services/api';

export type ChangePasswordField = keyof ChangePasswordInput;
export type ChangePasswordFieldErrors = Partial<
	Record<ChangePasswordField, string>
>;

export const CHANGE_PASSWORD_OFFLINE_NOTICE =
	'Necesitás conexión a internet para actualizar tu contraseña.';
const FALLBACK_CHANGE_PASSWORD_ERROR =
	'No se pudo actualizar la contraseña. Intentá nuevamente.';

/** Shared web schema: first error message per field, `{}` when valid. */
export const validateChangePassword = (
	input: ChangePasswordInput,
): ChangePasswordFieldErrors => {
	const result = changePasswordSchema.safeParse(input);
	if (result.success) return {};
	const errors: ChangePasswordFieldErrors = {};
	for (const issue of result.error.issues) {
		const field = issue.path[0] as ChangePasswordField | undefined;
		if (field && !errors[field]) errors[field] = issue.message;
	}
	return errors;
};

/** Same endpoint the web uses (`PATCH /users/me/password`). */
export const changePassword = async (
	input: ChangePasswordInput,
): Promise<void> => {
	await api.patch(USER_ROUTES.changePassword, input);
};

/** Server message when there is one, a Spanish fallback otherwise. */
export const getChangePasswordErrorMessage = (error: unknown): string => {
	if (axios.isAxiosError(error)) {
		if (!error.response) return CHANGE_PASSWORD_OFFLINE_NOTICE;
		const message = (
			error.response.data as { message?: string | string[] } | undefined
		)?.message;
		if (Array.isArray(message) && message.length > 0) return message.join(', ');
		if (typeof message === 'string' && message.trim()) return message;
	}
	return FALLBACK_CHANGE_PASSWORD_ERROR;
};
