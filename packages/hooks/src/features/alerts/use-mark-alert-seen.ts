import { ALERT_ROUTES, type ApiResponse } from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useMarkAlertSeen() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (alertId: string) => {
			const res = await apiClient.patch<ApiResponse<void>>(
				ALERT_ROUTES.seen(alertId),
			);
			return res.data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.alerts.unseen });
			queryClient.invalidateQueries({ queryKey: queryKeys.alerts.count });
			queryClient.invalidateQueries({ queryKey: ['alerts', 'list'] });
		},
	});
}
