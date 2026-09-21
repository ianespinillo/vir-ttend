import {
	type AddMembershipPayload,
	type ApiResponse,
	type Membership,
	TENANT_ROUTES,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useAddMembership() {
	const qc = useQueryClient();
	return useMutation<
		Membership,
		Error,
		{ tenantId: string; data: AddMembershipPayload }
	>({
		mutationFn: async ({ tenantId, data }) => {
			const res = await apiClient.post<ApiResponse<Membership>>(
				TENANT_ROUTES.memberships(tenantId),
				data,
			);
			return res.data.data;
		},
		onSuccess: (_, { tenantId }) => {
			qc.invalidateQueries({
				queryKey: queryKeys.tenants.users(tenantId),
			});
		},
	});
}
