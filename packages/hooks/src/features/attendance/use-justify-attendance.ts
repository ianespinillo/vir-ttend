import {
	ATTENDANCE_ROUTES,
	type ApiResponse,
	type ErrorResponse,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface JustifyAttendancePayload {
	id: string;
	reason: string;
	notes?: string;
	courseId?: string;
	date?: string;
}

export function useJustifyAttendance() {
	const queryClient = useQueryClient();

	return useMutation<
		unknown,
		AxiosError<ErrorResponse>,
		JustifyAttendancePayload
	>({
		mutationFn: async ({ id, reason, notes }) => {
			const res = await apiClient.post<ApiResponse<unknown>>(
				ATTENDANCE_ROUTES.justify(id),
				{
					reason,
					notes,
				},
			);
			return res.data.data;
		},
		onSuccess: (_, variables) => {
			if (variables.courseId && variables.date) {
				queryClient.invalidateQueries({
					queryKey: queryKeys.attendance.daily(variables.courseId, variables.date),
				});
				queryClient.invalidateQueries({
					queryKey: queryKeys.attendance.metrics(variables.courseId, variables.date),
				});
			} else {
				queryClient.invalidateQueries({ queryKey: ['attendance'] });
			}
		},
	});
}
