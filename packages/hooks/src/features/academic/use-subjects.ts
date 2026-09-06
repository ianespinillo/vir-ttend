import {
	ACADEMIC_ROUTES,
	type ApiResponse,
	type ISubjectResponse,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useSubjects(courseId?: string) {
	return useQuery<ISubjectResponse[]>({
		queryKey: queryKeys.subjects.list(courseId ?? ''),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<ISubjectResponse[]>>(
				ACADEMIC_ROUTES.subjects,
				{ params: { courseId } },
			);
			return res.data.data ?? [];
		},
		enabled: Boolean(courseId),
		staleTime: 1000 * 60 * 5,
	});
}
