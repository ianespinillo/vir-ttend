import { ATTENDANCE_ROUTES } from '@repo/common';
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
			const res = await apiClient.post(ATTENDANCE_ROUTES.subjectCopy, payload);
			return res.data;
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
