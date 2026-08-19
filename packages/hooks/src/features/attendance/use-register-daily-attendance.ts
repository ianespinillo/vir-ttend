import {
	ATTENDANCE_ROUTES,
	type ApiResponse,
	type AttendanceStatus,
	type ErrorResponse,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface RegisterDailyAttendancePayload {
	courseId: string;
	date: string;
	records: Array<{
		studentId: string;
		status: AttendanceStatus;
	}>;
}

export function useRegisterDailyAttendance() {
	const queryClient = useQueryClient();

	return useMutation<
		unknown,
		AxiosError<ErrorResponse>,
		RegisterDailyAttendancePayload
	>({
		mutationFn: async (payload) => {
			const res = await apiClient.post<ApiResponse<unknown>>(
				ATTENDANCE_ROUTES.daily,
				payload,
			);
			return res.data.data;
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
