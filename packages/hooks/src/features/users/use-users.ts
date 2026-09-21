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
	search?: string;
	tenantId?: string;
}

export function useUsers(params: UseUsersParams = {}) {
	const { role, page = 1, limit = 20, search, tenantId } = params;
	return useQuery<PaginatedResponse<IUserWithMembershipResponse>>({
		queryKey: queryKeys.users.list({ role, page, limit, search, tenantId }),
		queryFn: async () => {
			const res = await apiClient.get<
				ApiResponse<PaginatedResponse<IUserWithMembershipResponse>>
			>(USER_ROUTES.users, {
				params: { role, page, limit, search, tenantId },
			});
			return res.data.data;
		},
		staleTime: 1000 * 60 * 2,
	});
}
