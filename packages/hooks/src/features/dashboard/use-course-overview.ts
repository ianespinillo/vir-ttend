import {
	type ApiResponse,
	type CourseSnapshotDetail,
	DASHBOARD_ROUTES,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface UseCourseOverviewParams {
	courseId?: string;
	date?: string;
}

export function useCourseOverview({
	courseId,
	date,
}: UseCourseOverviewParams = {}) {
	return useQuery<CourseSnapshotDetail>({
		queryKey: queryKeys.dashboard.course(courseId ?? '', date ?? ''),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<CourseSnapshotDetail>>(
				DASHBOARD_ROUTES.dashboardCourse(courseId as string),
				{ params: { date } },
			);
			return res.data.data;
		},
		enabled: Boolean(courseId && date),
	});
}
