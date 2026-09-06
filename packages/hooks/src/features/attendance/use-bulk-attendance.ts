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

export interface BulkAttendancePayload {
	courseId: string;
	date: string;
	defaultStatus: AttendanceStatus;
}

export function useBulkAttendance() {
	const queryClient = useQueryClient();

	return useMutation<unknown, AxiosError<ErrorResponse>, BulkAttendancePayload>({
		mutationFn: async (payload) => {
			const res = await apiClient.post<ApiResponse<unknown>>(
				ATTENDANCE_ROUTES.dailyAll,
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
