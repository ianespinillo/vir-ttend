import {
	type ApiResponse,
	TENANT_ROUTES,
	type TenantResponse,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useTenants() {
	return useQuery<TenantResponse[]>({
		queryKey: queryKeys.tenants.all(),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<TenantResponse[]>>(
				TENANT_ROUTES.tenants,
			);
			return res.data.data;
		},
	});
}
