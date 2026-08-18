import {
	ALERT_ROUTES,
	type AlertsListResponse,
	type ApiResponse,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useUnseenAlerts() {
	return useQuery<AlertsListResponse>({
		queryKey: queryKeys.alerts.unseen,
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<AlertsListResponse>>(
				ALERT_ROUTES.unseen,
			);
			return res.data.data;
		},
		staleTime: 1000 * 30,
	});
}
