import { type ApiResponse, TENANT_ROUTES, type Tenant } from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useTenant(id: string) {
	return useQuery<Tenant>({
		queryKey: queryKeys.tenants.detail(id),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<Tenant>>(
				TENANT_ROUTES.tenant(id),
			);
			return res.data.data;
		},
		enabled: Boolean(id),
	});
}
