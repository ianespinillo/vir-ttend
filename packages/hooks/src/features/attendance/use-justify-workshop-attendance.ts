import {
	ATTENDANCE_ROUTES,
	type ApiResponse,
	type ErrorResponse,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface JustifyWorkshopAttendancePayload {
	recordId: string;
	reason: string;
	notes?: string;
	commissionId?: string;
	date?: string;
}

export function useJustifyWorkshopAttendance() {
	const queryClient = useQueryClient();

	return useMutation<
		unknown,
		AxiosError<ErrorResponse>,
		JustifyWorkshopAttendancePayload
	>({
		mutationFn: async ({ recordId, reason, notes }) => {
			const res = await apiClient.post<ApiResponse<unknown>>(
				ATTENDANCE_ROUTES.workshopJustify(recordId),
				{ reason, notes },
			);
			return res.data.data;
		},
		onSuccess: (_, variables) => {
			if (variables.commissionId && variables.date) {
				queryClient.invalidateQueries({
					queryKey: queryKeys.attendance.workshop(
						variables.commissionId,
						variables.date,
					),
				});
			} else {
				queryClient.invalidateQueries({ queryKey: ['attendance', 'workshop'] });
			}
		},
	});
}
