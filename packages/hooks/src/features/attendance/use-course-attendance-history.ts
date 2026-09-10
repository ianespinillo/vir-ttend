import {
	ATTENDANCE_ROUTES,
	type ApiResponse,
	type AttendanceRecord,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface UseCourseAttendanceHistoryParams {
	courseId?: string;
	from?: string;
	to?: string;
}

export function useCourseAttendanceHistory({
	courseId,
	from,
	to,
}: UseCourseAttendanceHistoryParams) {
	return useQuery<AttendanceRecord[]>({
		queryKey: queryKeys.attendance.history(courseId || '', from, to),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<AttendanceRecord[]>>(
				ATTENDANCE_ROUTES.history,
				{ params: { courseId, from, to } },
			);
			return res.data.data ?? [];
		},
		enabled: Boolean(courseId && from && to),
	});
}
