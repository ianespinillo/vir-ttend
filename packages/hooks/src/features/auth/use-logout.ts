import { AUTH_ROUTES, type ApiResponse } from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';

export function useLogout() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			const res = await apiClient.post<ApiResponse<void>>(AUTH_ROUTES.logout);
			return res.data.data;
		},
		onSuccess: () => {
			queryClient.clear();
		},
	});
}
