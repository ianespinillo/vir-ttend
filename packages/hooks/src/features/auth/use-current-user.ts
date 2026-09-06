import { AUTH_ROUTES, type ApiResponse, type CurrentUser } from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useCurrentUser() {
	return useQuery<CurrentUser>({
		queryKey: queryKeys.auth.me,
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<CurrentUser>>(AUTH_ROUTES.me);
			return res.data.data;
		},
		retry: false,
		staleTime: 1000 * 60 * 5,
	});
}
