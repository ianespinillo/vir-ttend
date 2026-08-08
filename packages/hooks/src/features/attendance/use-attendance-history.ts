import { ATTENDANCE_ROUTES, type AttendanceRecord } from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface UseAttendanceHistoryParams {
	studentId: string;
	from: string;
	to: string;
}

export function useAttendanceHistory({
	studentId,
	from,
	to,
}: UseAttendanceHistoryParams) {
	return useQuery<AttendanceRecord[]>({
		queryKey: queryKeys.attendance.byStudent(studentId, from, to),
		queryFn: async () => {
			const res = await apiClient.get<AttendanceRecord[]>(
				ATTENDANCE_ROUTES.byStudent(studentId),
				{ params: { from, to } },
			);
			const data =
				(res.data as unknown as { data?: AttendanceRecord[] })?.data ?? res.data;
			return Array.isArray(data) ? data : [];
		},
		enabled: Boolean(studentId && from && to),
	});
}
