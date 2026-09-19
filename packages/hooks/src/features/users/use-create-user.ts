import {
	type ApiResponse,
	type CreateUserPayload,
	type CreateUserResponse,
	USER_ROUTES,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';

export function useCreateUser() {
	const qc = useQueryClient();
	return useMutation<CreateUserResponse, Error, CreateUserPayload>({
		mutationFn: async (payload) => {
			const res = await apiClient.post<ApiResponse<CreateUserResponse>>(
				USER_ROUTES.users,
				payload,
			);
			return res.data.data;
		},
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: ['users', 'list'],
			});
		},
	});
}
