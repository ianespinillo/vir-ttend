import {
	ATTENDANCE_ROUTES,
	type ApiResponse,
	type SubjectHistoryResponse,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface UseSubjectHistoryParams {
	subjectId: string;
	from: string;
	to: string;
}

export function useSubjectHistory({
	subjectId,
	from,
	to,
}: UseSubjectHistoryParams) {
	return useQuery<SubjectHistoryResponse>({
		queryKey: queryKeys.attendance.subjectHistory(subjectId, from, to),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<SubjectHistoryResponse>>(
				ATTENDANCE_ROUTES.subjectHistory(subjectId),
				{ params: { from, to } },
			);
			return res.data.data;
		},
		enabled: Boolean(subjectId && from && to),
	});
}
