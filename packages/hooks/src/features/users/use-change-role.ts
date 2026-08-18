import { type ApiResponse, type Roles, USER_ROUTES } from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';

export interface ChangeRoleVariables {
	userId: string;
	newRole: Roles;
}

export function useChangeRole() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, ChangeRoleVariables>({
		mutationFn: async ({ userId, newRole }) => {
			await apiClient.put<ApiResponse<void>>(USER_ROUTES.changeRole(userId), {
				newRole,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
		},
	});
}
