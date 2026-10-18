import { type ApiResponse, type Tenant, USER_ROUTES } from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useMyTenants(options?: { enabled?: boolean }) {
	return useQuery<Tenant[]>({
		queryKey: queryKeys.users.myTenants(),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<Tenant[]>>(
				USER_ROUTES.myTenants,
			);
			return res.data.data;
		},
		enabled: options?.enabled,
	});
}
