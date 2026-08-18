import {
	AUTH_ROUTES,
	type ApiResponse,
	type ErrorResponse,
	type ILoginResponse,
	type LoginFormValues,
} from '@repo/common';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '../../lib/axios-client';

export function useLogin() {
	return useMutation<ILoginResponse, AxiosError<ErrorResponse>, LoginFormValues>(
		{
			mutationFn: async (data) => {
				const res = await apiClient.post<ApiResponse<ILoginResponse>>(
					AUTH_ROUTES.login,
					data,
				);
				return res.data.data;
			},
		},
	);
}
