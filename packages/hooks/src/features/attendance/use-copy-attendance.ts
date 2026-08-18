import { ATTENDANCE_ROUTES, type ApiResponse } from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface CopyAttendancePayload {
	subjectId: string;
	targetDate: string;
	sourceDate?: string;
}

export function useCopyAttendance() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (payload: CopyAttendancePayload) => {
			const res = await apiClient.post<ApiResponse<unknown>>(
				ATTENDANCE_ROUTES.subjectCopy,
				payload,
			);
			return res.data.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.attendance.subject(
					variables.subjectId,
					variables.targetDate,
				),
			});
		},
	});
}
