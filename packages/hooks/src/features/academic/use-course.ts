import {
	ACADEMIC_ROUTES,
	type ApiResponse,
	type ICourseDetailResponse,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useCourse(id: string) {
	return useQuery<ICourseDetailResponse>({
		queryKey: queryKeys.courses.detail(id),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<ICourseDetailResponse>>(
				ACADEMIC_ROUTES.course(id),
			);
			return res.data.data;
		},
		enabled: Boolean(id),
	});
}
