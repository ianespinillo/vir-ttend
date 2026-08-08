import { ATTENDANCE_ROUTES, type AttendanceStatus } from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface BulkSubjectAttendancePayload {
	subjectId: string;
	date: string;
	status: AttendanceStatus;
}

export function useBulkSubjectAttendance() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (payload: BulkSubjectAttendancePayload) => {
			const res = await apiClient.post(ATTENDANCE_ROUTES.subjectAll, payload);
			return res.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.attendance.subject(variables.subjectId, variables.date),
			});
		},
	});
}
