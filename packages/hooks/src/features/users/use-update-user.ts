import {
	type ApiResponse,
	USER_ROUTES,
	type UpdateUserPayload,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useUpdateUser() {
	const qc = useQueryClient();
	return useMutation<void, Error, { id: string; data: UpdateUserPayload }>({
		mutationFn: async ({ id, data }) => {
			await apiClient.put<ApiResponse<void>>(USER_ROUTES.user(id), data);
		},
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: queryKeys.users.list(),
			});
		},
	});
}
