import { ALERT_ROUTES, type AlertsCount, type ApiResponse } from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useAlertsCount() {
	return useQuery<AlertsCount>({
		queryKey: queryKeys.alerts.count,
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<AlertsCount>>(
				ALERT_ROUTES.count,
			);
			return res.data.data;
		},
		staleTime: 1000 * 30,
		refetchInterval: 1000 * 60, // poll every minute
	});
}
