import { type ApiResponse, type CurrentUser, USER_ROUTES } from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useProfile() {
	return useQuery<CurrentUser>({
		queryKey: queryKeys.users.profile(),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<CurrentUser>>(USER_ROUTES.me);
			return res.data.data;
		},
	});
}
