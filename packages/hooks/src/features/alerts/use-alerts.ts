import {
	ALERT_ROUTES,
	type AlertsListResponse,
	type ApiResponse,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface UseAlertsParams {
	courseId?: string;
	alertType?: 'warning' | 'critical' | 'exceeded';
	page?: number;
	limit?: number;
}

export function useAlerts(params: UseAlertsParams = {}) {
	const { courseId, alertType, page = 1, limit = 20 } = params;
	return useQuery<AlertsListResponse>({
		queryKey: queryKeys.alerts.list({ courseId, alertType, page, limit }),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<AlertsListResponse>>(
				ALERT_ROUTES.alerts,
				{ params: { courseId, alertType, page, limit } },
			);
			return res.data.data;
		},
		staleTime: 1000 * 30, // alerts refresh every 30s
	});
}
