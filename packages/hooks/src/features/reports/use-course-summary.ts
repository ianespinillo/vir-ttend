import {
	type ApiResponse,
	type CourseSummary,
	REPORT_ROUTES,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface UseCourseSummaryParams {
	courseId?: string;
	academicYearId?: string;
}

export function useCourseSummary({
	courseId,
	academicYearId,
}: UseCourseSummaryParams = {}) {
	return useQuery<CourseSummary>({
		queryKey: queryKeys.reports.courseSummary(
			courseId ?? '',
			academicYearId ?? '',
		),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<CourseSummary>>(
				REPORT_ROUTES.courseSummary(courseId as string),
				{ params: { academicYearId } },
			);
			return res.data.data;
		},
		enabled: Boolean(courseId && academicYearId),
		staleTime: 1000 * 60 * 10,
	});
}
