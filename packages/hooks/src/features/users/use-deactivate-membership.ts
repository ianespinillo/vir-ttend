import { type ApiResponse, USER_ROUTES } from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';

export function useDeactivateMembership() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: async (userId) => {
			await apiClient.delete<ApiResponse<void>>(`/users/${userId}/membership`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
		},
	});
}
