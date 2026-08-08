import { ATTENDANCE_ROUTES, type AttendanceStatus } from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface BulkAttendancePayload {
	courseId: string;
	date: string;
	defaultStatus: AttendanceStatus;
}

export function useBulkAttendance() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (payload: BulkAttendancePayload) => {
			const res = await apiClient.post(ATTENDANCE_ROUTES.dailyAll, payload);
			return res.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.attendance.daily(variables.courseId, variables.date),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.attendance.metrics(variables.courseId, variables.date),
			});
		},
	});
}
