import { ACADEMIC_ROUTES, type ICourseResponse } from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useCourses(filters?: Record<string, unknown>) {
	return useQuery<ICourseResponse[]>({
		queryKey: queryKeys.courses.list(filters),
		queryFn: async () => {
			const res = await apiClient.get<ICourseResponse[]>(ACADEMIC_ROUTES.courses, {
				params: filters,
			});
			return res.data;
		},
	});
}
