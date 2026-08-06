import { AUTH_ROUTES } from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';

export function useLogout() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			await apiClient.post(AUTH_ROUTES.logout);
		},
		onSuccess: () => {
			queryClient.clear();
		},
	});
}
