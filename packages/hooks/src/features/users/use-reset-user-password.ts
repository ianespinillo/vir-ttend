import type { ApiResponse } from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';

export interface ResetUserPasswordPayload {
	userId: string;
	tenantId?: string;
}

export interface ResetUserPasswordResponse {
	userId: string;
	email: string;
	firstName: string;
	lastName: string;
	temporaryPassword: string;
}

export function useResetUserPassword() {
	const queryClient = useQueryClient();

	return useMutation<ResetUserPasswordResponse, Error, ResetUserPasswordPayload>(
		{
			mutationFn: async ({ userId, tenantId }) => {
				const res = await apiClient.post<ApiResponse<ResetUserPasswordResponse>>(
					`/users/${userId}/reset-password`,
					{ tenantId },
				);
				return res.data.data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
			},
		},
	);
}
