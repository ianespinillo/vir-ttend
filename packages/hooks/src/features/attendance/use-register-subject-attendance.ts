import { ATTENDANCE_ROUTES, type AttendanceStatus } from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface RegisterSubjectAttendancePayload {
	subjectId: string;
	courseId: string;
	date: string;
	records: Array<{
		studentId: string;
		status: AttendanceStatus;
	}>;
}

export function useRegisterSubjectAttendance() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (payload: RegisterSubjectAttendancePayload) => {
			const res = await apiClient.post(ATTENDANCE_ROUTES.subject, payload);
			return res.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.attendance.subject(variables.subjectId, variables.date),
			});
		},
	});
}
