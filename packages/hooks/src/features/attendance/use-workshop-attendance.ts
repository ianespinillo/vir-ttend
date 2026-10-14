import {
	ATTENDANCE_ROUTES,
	type ApiResponse,
	type WorkshopAttendance,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface UseWorkshopAttendanceParams {
	commissionId: string;
	date: string;
}

export function useWorkshopAttendance({
	commissionId,
	date,
}: UseWorkshopAttendanceParams) {
	return useQuery<WorkshopAttendance | null>({
		queryKey: queryKeys.attendance.workshop(commissionId, date),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<WorkshopAttendance>>(
				ATTENDANCE_ROUTES.workshop,
				{ params: { commissionId, date } },
			);
			return res.data.data ?? null;
		},
		enabled: Boolean(commissionId && date),
	});
}
