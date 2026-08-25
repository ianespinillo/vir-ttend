import {
	type ApiResponse,
	type CreateUserPayload,
	type IUserWithMembershipResponse,
	USER_ROUTES,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useCreateUser() {
	const qc = useQueryClient();
	return useMutation<IUserWithMembershipResponse, Error, CreateUserPayload>({
		mutationFn: async (payload) => {
			const res = await apiClient.post<ApiResponse<IUserWithMembershipResponse>>(
				USER_ROUTES.users,
				payload,
			);
			return res.data.data;
		},
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: queryKeys.users.list(),
			});
		},
	});
}
