import {
	ATTENDANCE_ROUTES,
	type ApiResponse,
	type ErrorResponse,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface BulkJustifyAttendancePayload {
	recordIds: string[];
	reason: string;
	notes?: string;
	courseId?: string;
	date?: string;
}

export interface BulkJustifyAttendanceResult {
	justified: number;
}

/** Justifies several daily/subject attendance records at once (all or nothing). */
export function useBulkJustifyAttendance() {
	const queryClient = useQueryClient();

	return useMutation<
		BulkJustifyAttendanceResult,
		AxiosError<ErrorResponse>,
		BulkJustifyAttendancePayload
	>({
		mutationFn: async ({ recordIds, reason, notes }) => {
			const res = await apiClient.post<ApiResponse<BulkJustifyAttendanceResult>>(
				ATTENDANCE_ROUTES.justifyBulk,
				{ recordIds, reason, notes },
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
