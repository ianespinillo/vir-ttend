import {
	ADMIN_ROUTES,
	type ApiResponse,
	type SuperAdminAnalytics,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useSuperAdminAnalytics() {
	return useQuery<SuperAdminAnalytics>({
		queryKey: queryKeys.dashboard.superAdmin,
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<SuperAdminAnalytics>>(
				ADMIN_ROUTES.analytics,
			);
			return res.data.data;
		},
		staleTime: 1000 * 60 * 5,
	});
}
