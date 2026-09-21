import { type ApiResponse, TENANT_ROUTES } from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useToggleTenantStatus() {
	const qc = useQueryClient();
	return useMutation<void, Error, { id: string; isActive: boolean }>({
		mutationFn: async ({ id, isActive }) => {
			await apiClient.patch<ApiResponse<void>>(TENANT_ROUTES.status(id), {
				isActive,
			});
		},
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: queryKeys.tenants.all(),
			});
		},
	});
}
