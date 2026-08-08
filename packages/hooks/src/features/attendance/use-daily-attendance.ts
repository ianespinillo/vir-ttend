import { ATTENDANCE_ROUTES, type AttendanceRecord } from '@repo/common';
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
			const res = await apiClient.get<AttendanceRecord[]>(
				ATTENDANCE_ROUTES.daily,
				{
					params: { courseId, date },
				},
			);
			const data =
				(res.data as unknown as { data?: AttendanceRecord[] })?.data ?? res.data;
			return Array.isArray(data) ? data : [];
		},
		enabled: Boolean(courseId && date),
	});
}
