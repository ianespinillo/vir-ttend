import {
	ATTENDANCE_ROUTES,
	type ApiResponse,
	type AttendanceMetrics,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface UseAttendanceMetricsParams {
	courseId: string;
	date: string;
}

export function useAttendanceMetrics({
	courseId,
	date,
}: UseAttendanceMetricsParams) {
	return useQuery<AttendanceMetrics>({
		queryKey: queryKeys.attendance.metrics(courseId, date),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<AttendanceMetrics>>(
				ATTENDANCE_ROUTES.metrics,
				{
					params: { courseId, date },
				},
			);
			return res.data.data;
		},
		enabled: Boolean(courseId && date),
	});
}
