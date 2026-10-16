import {
	ATTENDANCE_ROUTES,
	type ApiResponse,
	type MyWorkshopCommission,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useMyWorkshopCommissions(date: string) {
	return useQuery<MyWorkshopCommission[]>({
		queryKey: queryKeys.attendance.workshopCommissions(date),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<MyWorkshopCommission[]>>(
				ATTENDANCE_ROUTES.workshopMyCommissions,
				{ params: { date } },
			);
			return res.data.data ?? [];
		},
		enabled: Boolean(date),
	});
}
