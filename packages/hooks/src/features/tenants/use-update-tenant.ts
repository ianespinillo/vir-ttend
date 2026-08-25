import {
	type ApiResponse,
	TENANT_ROUTES,
	type UpdateTenantPayload,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useUpdateTenant() {
	const qc = useQueryClient();
	return useMutation<void, Error, { id: string; data: UpdateTenantPayload }>({
		mutationFn: async ({ id, data }) => {
			await apiClient.put<ApiResponse<void>>(TENANT_ROUTES.tenant(id), data);
		},
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: queryKeys.tenants.all(),
			});
		},
	});
}
