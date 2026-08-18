import {
	type ApiResponse,
	DASHBOARD_ROUTES,
	type DashboardMetrics,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useDashboardMetrics(academicYearId?: string) {
	return useQuery<DashboardMetrics>({
		queryKey: queryKeys.dashboard.metrics(academicYearId ?? ''),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<DashboardMetrics>>(
				DASHBOARD_ROUTES.dashboardMetrics,
				{ params: { academicYearId } },
			);
			return res.data.data;
		},
		enabled: Boolean(academicYearId),
		staleTime: 1000 * 60 * 5,
	});
}
