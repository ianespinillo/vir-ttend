import {
	AUTH_ROUTES,
	type ApiResponse,
	type CurrentUser,
	type ErrorResponse,
	type SelectTenantFormValues,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useSelectTenant() {
	const queryClient = useQueryClient();

	return useMutation<
		CurrentUser,
		AxiosError<ErrorResponse>,
		SelectTenantFormValues
	>({
		mutationFn: async (data) => {
			const res = await apiClient.post<ApiResponse<CurrentUser>>(
				AUTH_ROUTES.selectTenant,
				data,
			);
			return res.data.data;
		},
		onSuccess: (user) => {
			queryClient.setQueryData(queryKeys.auth.me, user);
			queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
		},
	});
}
