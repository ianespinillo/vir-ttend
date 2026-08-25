import {
	type ApiResponse,
	type CreateTenantPayload,
	TENANT_ROUTES,
	type Tenant,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useCreateTenant() {
	const qc = useQueryClient();
	return useMutation<Tenant, Error, CreateTenantPayload>({
		mutationFn: async (payload) => {
			const res = await apiClient.post<ApiResponse<Tenant>>(
				TENANT_ROUTES.tenants,
				payload,
			);
			return res.data.data;
		},
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: queryKeys.tenants.all(),
			});
		},
	});
}
