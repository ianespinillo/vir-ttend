import { type ApiResponse, TENANT_ROUTES, type Tenant } from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useTenants(options?: { enabled?: boolean }) {
	return useQuery<Tenant[]>({
		queryKey: queryKeys.tenants.all(),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<Tenant[]>>(
				TENANT_ROUTES.tenants,
			);
			return res.data.data;
		},
		enabled: options?.enabled,
	});
}
