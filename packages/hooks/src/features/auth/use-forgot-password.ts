import {
	AUTH_ROUTES,
	type ApiResponse,
	type ErrorResponse,
	type ForgotPasswordInput,
	type ResetPasswordInput,
} from '@repo/common';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '../../lib/axios-client';

/** Asks the API to email a reset code. Resolves the same whether or not the email exists. */
export function useRequestPasswordReset() {
	return useMutation<void, AxiosError<ErrorResponse>, ForgotPasswordInput>({
		mutationFn: async (data) => {
			await apiClient.post<ApiResponse<null>>(AUTH_ROUTES.forgotPassword, data);
		},
	});
}

/** Sets a new password with the emailed 6-digit code. */
export function useResetPassword() {
	return useMutation<void, AxiosError<ErrorResponse>, ResetPasswordInput>({
		mutationFn: async (data) => {
			await apiClient.post<ApiResponse<null>>(AUTH_ROUTES.resetPassword, data);
		},
	});
}
