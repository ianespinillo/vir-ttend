import {
	AUTH_ROUTES,
	type ApiResponse,
	type CurrentUser,
	type ErrorResponse,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useExitTenant() {
	const queryClient = useQueryClient();

	return useMutation<CurrentUser, AxiosError<ErrorResponse>, void>({
		mutationFn: async () => {
			const res = await apiClient.post<ApiResponse<{ user: CurrentUser }>>(
				AUTH_ROUTES.exitTenant,
			);
			return res.data.data.user;
		},
		onSuccess: (user) => {
			queryClient.clear();
			queryClient.setQueryData(queryKeys.auth.me, user);
		},
	});
}
