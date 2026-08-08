import {
	ATTENDANCE_ROUTES,
	type SubjectAttendanceResponse,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface UseSubjectAttendanceParams {
	subjectId: string;
	date: string;
}

export function useSubjectAttendance({
	subjectId,
	date,
}: UseSubjectAttendanceParams) {
	return useQuery<SubjectAttendanceResponse>({
		queryKey: queryKeys.attendance.subject(subjectId, date),
		queryFn: async () => {
			const res = await apiClient.get<SubjectAttendanceResponse>(
				ATTENDANCE_ROUTES.subject,
				{
					params: { subjectId, date },
				},
			);
			const data =
				(res.data as unknown as { data?: SubjectAttendanceResponse })?.data ??
				res.data;
			return data;
		},
		enabled: Boolean(subjectId && date),
	});
}
