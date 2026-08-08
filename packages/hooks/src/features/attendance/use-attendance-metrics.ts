import { ATTENDANCE_ROUTES, type AttendanceMetrics } from '@repo/common';
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
			const res = await apiClient.get<AttendanceMetrics>(
				ATTENDANCE_ROUTES.metrics,
				{
					params: { courseId, date },
				},
			);
			const data =
				(res.data as unknown as { data?: AttendanceMetrics })?.data ?? res.data;
			return data;
		},
		enabled: Boolean(courseId && date),
	});
}
