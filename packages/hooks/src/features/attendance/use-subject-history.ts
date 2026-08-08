import { ATTENDANCE_ROUTES, type SubjectHistoryResponse } from '@repo/common';
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
			const res = await apiClient.get<SubjectHistoryResponse>(
				ATTENDANCE_ROUTES.subjectHistory(subjectId),
				{ params: { from, to } },
			);
			const data =
				(res.data as unknown as { data?: SubjectHistoryResponse })?.data ??
				res.data;
			return data;
		},
		enabled: Boolean(subjectId && from && to),
	});
}
