import {
	ACADEMIC_ROUTES,
	type ApiResponse,
	type ICourseResponse,
	type LevelType,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface UseCoursesParams {
	academicYearId?: string;
	level?: LevelType;
	preceptorId?: string;
}

export function useCourses(params: UseCoursesParams = {}) {
	const { academicYearId, level, preceptorId } = params;

	return useQuery<ICourseResponse[]>({
		queryKey: queryKeys.courses.list({ academicYearId, level, preceptorId }),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<ICourseResponse[]>>(
				ACADEMIC_ROUTES.courses,
				{
					params: { academicYearId, level, preceptorId },
				},
			);
			return res.data.data ?? [];
		},
		enabled: Boolean(academicYearId),
		staleTime: 1000 * 60 * 5,
	});
}
