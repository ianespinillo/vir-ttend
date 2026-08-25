import {
	type ApiResponse,
	type IUserWithMembershipResponse,
	USER_ROUTES,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useTenantUsers(tenantId: string) {
	return useQuery<IUserWithMembershipResponse[]>({
		queryKey: queryKeys.tenants.users(tenantId),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<IUserWithMembershipResponse[]>>(
				USER_ROUTES.users,
				{
					params: { tenantId },
				},
			);
			return res.data.data;
		},
		enabled: Boolean(tenantId),
	});
}
