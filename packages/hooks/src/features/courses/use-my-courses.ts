import { ACADEMIC_ROUTES, type ICourseResponse } from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';

export interface UseMyCoursesParams {
	academicYearId?: string;
	isPreceptor?: boolean;
}

export function useMyCourses({
	academicYearId,
	isPreceptor = true,
}: UseMyCoursesParams = {}) {
	return useQuery<ICourseResponse[]>({
		queryKey: ['courses', 'my-courses', academicYearId, isPreceptor],
		queryFn: async () => {
			const endpoint =
				isPreceptor && academicYearId
					? ACADEMIC_ROUTES.coursesByPreceptor
					: ACADEMIC_ROUTES.courses;

			const res = await apiClient.get<ICourseResponse[]>(endpoint, {
				params: academicYearId ? { academicYearId } : undefined,
			});

			const data =
				(res.data as unknown as { data?: ICourseResponse[] })?.data ?? res.data;
			return Array.isArray(data) ? data : [];
		},
		enabled: Boolean(!isPreceptor || academicYearId),
	});
}
