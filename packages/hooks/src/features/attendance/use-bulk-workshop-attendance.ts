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

export interface BulkWorkshopAttendancePayload {
	commissionId: string;
	date: string;
	status: AttendanceStatus;
}

export function useBulkWorkshopAttendance() {
	const queryClient = useQueryClient();

	return useMutation<
		unknown,
		AxiosError<ErrorResponse>,
		BulkWorkshopAttendancePayload
	>({
		mutationFn: async (payload) => {
			const res = await apiClient.post<ApiResponse<unknown>>(
				ATTENDANCE_ROUTES.workshopAll,
				payload,
			);
			return res.data.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.attendance.workshop(
					variables.commissionId,
					variables.date,
				),
			});
		},
	});
}
