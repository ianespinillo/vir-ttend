import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { isCachedWorkshopOnlyCourse } from './course-list';
import { queryKeys } from './query-keys';
import type { CourseListItem, PreceptorCourse } from './types';

/** Workshop-only (7th year technical) per the course rows already cached. */
export function useIsWorkshopOnlyCourse(courseId: string): boolean {
	const queryClient = useQueryClient();
	return useMemo(() => {
		const dashboards = queryClient
			.getQueriesData<CourseListItem[]>({
				queryKey: queryKeys.preceptorDashboard('').slice(0, 1),
			})
			.map(([, data]) => data);
		const assigned = queryClient
			.getQueriesData<PreceptorCourse[]>({
				queryKey: queryKeys.preceptorCourses('').slice(0, 2),
			})
			.map(([, data]) => data);
		return isCachedWorkshopOnlyCourse(courseId, dashboards, assigned);
	}, [queryClient, courseId]);
}
