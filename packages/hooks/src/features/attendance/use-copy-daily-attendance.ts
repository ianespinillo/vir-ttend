import {
	ATTENDANCE_ROUTES,
	type ApiResponse,
	type CopyDailyAttendanceResult,
	type ErrorResponse,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface CopyDailyAttendancePayload {
	courseId: string;
	targetDate: string;
	sourceDate?: string;
}

export function useCopyDailyAttendance() {
	const queryClient = useQueryClient();

	return useMutation<
		CopyDailyAttendanceResult,
		AxiosError<ErrorResponse>,
		CopyDailyAttendancePayload
	>({
		mutationFn: async (payload) => {
			const res = await apiClient.post<ApiResponse<CopyDailyAttendanceResult>>(
				ATTENDANCE_ROUTES.dailyCopy,
				payload,
			);
			return res.data.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.attendance.daily(
					variables.courseId,
					variables.targetDate,
				),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.attendance.metrics(
					variables.courseId,
					variables.targetDate,
				),
			});
		},
	});
}
