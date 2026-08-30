import { type ApiResponse, TENANT_ROUTES } from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useRemoveMembership() {
	const qc = useQueryClient();
	return useMutation<void, Error, { email: string; tenantId: string }>({
		mutationFn: async ({ email, tenantId }) => {
			await apiClient.delete<ApiResponse<void>>(
				TENANT_ROUTES.memberships(tenantId),
				{ data: { email } },
			);
		},
		onSuccess: (_, { tenantId }) => {
			qc.invalidateQueries({
				queryKey: queryKeys.tenants.users(tenantId),
			});
		},
	});
}
