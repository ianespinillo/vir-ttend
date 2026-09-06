import {
	type ApiResponse,
	type IUserWithMembershipResponse,
	type PaginatedResponse,
	type Roles,
	USER_ROUTES,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface UseUsersParams {
	role?: Roles;
	page?: number;
	limit?: number;
}

export function useUsers(params: UseUsersParams = {}) {
	const { role, page = 1, limit = 20 } = params;
	return useQuery<PaginatedResponse<IUserWithMembershipResponse>>({
		queryKey: queryKeys.users.list({ role, page, limit }),
		queryFn: async () => {
			const res = await apiClient.get<
				ApiResponse<PaginatedResponse<IUserWithMembershipResponse>>
			>(USER_ROUTES.users, { params: { role, page, limit } });
			return res.data.data;
		},
		staleTime: 1000 * 60 * 2,
	});
}
