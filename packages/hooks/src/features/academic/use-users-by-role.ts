import {
	type ApiResponse,
	type IUserResponse,
	PaginatedResponse,
	USER_ROUTES,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';

export function useUsersByRole(role?: string) {
	return useQuery<PaginatedResponse<IUserResponse>>({
		queryKey: ['users', 'role', role ?? 'all'],
		queryFn: async () => {
			const res = await apiClient.get<
				ApiResponse<PaginatedResponse<IUserResponse>>
			>(USER_ROUTES.users, {
				params: { role },
			});
			return res.data.data;
		},
		enabled: Boolean(role),
	});
}
