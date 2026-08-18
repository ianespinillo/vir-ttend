import {
	ATTENDANCE_ROUTES,
	type ApiResponse,
	type AttendanceRecord,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface UseDailyAttendanceParams {
	courseId: string;
	date: string;
}

export function useDailyAttendance({
	courseId,
	date,
}: UseDailyAttendanceParams) {
	return useQuery<AttendanceRecord[]>({
		queryKey: queryKeys.attendance.daily(courseId, date),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<AttendanceRecord[]>>(
				ATTENDANCE_ROUTES.daily,
				{
					params: { courseId, date },
				},
			);
			return res.data.data ?? [];
		},
		enabled: Boolean(courseId && date),
	});
}
