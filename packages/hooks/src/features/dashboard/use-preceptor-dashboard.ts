import {
	type ApiResponse,
	DASHBOARD_ROUTES,
	type PreceptorDashboard,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function usePreceptorDashboard(date?: string) {
	return useQuery<PreceptorDashboard>({
		queryKey: queryKeys.dashboard.preceptor(date ?? ''),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<PreceptorDashboard>>(
				DASHBOARD_ROUTES.dashboard,
				{ params: { date } },
			);
			return res.data.data;
		},
		enabled: Boolean(date),
		staleTime: 1000 * 60, // 1 minute - dashboard data changes frequently
	});
}
