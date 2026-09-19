import { type ApiResponse } from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';

export interface ToggleUserStatusPayload {
	userId: string;
	isActive: boolean;
	tenantId?: string;
}

export function useToggleUserStatus() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, ToggleUserStatusPayload>({
		mutationFn: async ({ userId, isActive, tenantId }) => {
			await apiClient.patch<ApiResponse<void>>(`/users/${userId}/status`, {
				isActive,
				tenantId,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
		},
	});
}
