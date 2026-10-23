import {
	ATTENDANCE_ROUTES,
	type ApiResponse,
	type ErrorResponse,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';
import type { BulkJustifyAttendanceResult } from './use-bulk-justify-attendance';

export interface BulkJustifyWorkshopAttendancePayload {
	recordIds: string[];
	reason: string;
	notes?: string;
	commissionId?: string;
	date?: string;
}

/** Justifies several workshop attendance records at once (all or nothing). */
export function useBulkJustifyWorkshopAttendance() {
	const queryClient = useQueryClient();

	return useMutation<
		BulkJustifyAttendanceResult,
		AxiosError<ErrorResponse>,
		BulkJustifyWorkshopAttendancePayload
	>({
		mutationFn: async ({ recordIds, reason, notes }) => {
			const res = await apiClient.post<ApiResponse<BulkJustifyAttendanceResult>>(
				ATTENDANCE_ROUTES.workshopJustifyBulk,
				{ recordIds, reason, notes },
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
