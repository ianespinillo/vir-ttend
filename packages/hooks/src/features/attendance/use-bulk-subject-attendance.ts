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

export interface BulkSubjectAttendancePayload {
	subjectId: string;
	date: string;
	status: AttendanceStatus;
}

export function useBulkSubjectAttendance() {
	const queryClient = useQueryClient();

	return useMutation<
		unknown,
		AxiosError<ErrorResponse>,
		BulkSubjectAttendancePayload
	>({
		mutationFn: async (payload) => {
			const res = await apiClient.post<ApiResponse<unknown>>(
				ATTENDANCE_ROUTES.subjectAll,
				payload,
			);
			return res.data.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.attendance.subject(variables.subjectId, variables.date),
			});
		},
	});
}
