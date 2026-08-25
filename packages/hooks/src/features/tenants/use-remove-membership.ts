import { type ApiResponse, TENANT_ROUTES } from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useRemoveMembership() {
	const qc = useQueryClient();
	return useMutation<void, Error, { membershipId: string; tenantId: string }>({
		mutationFn: async ({ membershipId }) => {
			await apiClient.delete<ApiResponse<void>>(
				TENANT_ROUTES.membership(membershipId),
			);
		},
		onSuccess: (_, { tenantId }) => {
			qc.invalidateQueries({
				queryKey: queryKeys.tenants.users(tenantId),
			});
		},
	});
}
