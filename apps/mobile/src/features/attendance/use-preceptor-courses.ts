import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { resolveCourseList } from './course-list';
import { attendanceQueries } from './queries';
import type { CourseListItem } from './types';

/**
 * Courses of the preceptor for the home screen. Reads the dashboard (shared
 * key, so the offline preload fills it) and, when the dashboard is empty or
 * failed, falls back to the active academic year + courses assigned to the
 * preceptor.
 */
export const usePreceptorCourses = (date: string, enabled: boolean) => {
	const dashboard = useQuery({
		...attendanceQueries.preceptorDashboard(date),
		enabled,
	});

	const dashboardIsEmpty = dashboard.isSuccess && dashboard.data.length === 0;
	const dashboardFailed = dashboard.isError && dashboard.data === undefined;
	const needsFallback = enabled && (dashboardIsEmpty || dashboardFailed);

	const year = useQuery({
		...attendanceQueries.activeAcademicYear(),
		enabled: needsFallback,
	});
	const yearId = year.data?.id ?? '';
	const assigned = useQuery({
		...attendanceQueries.preceptorCourses(yearId),
		enabled: needsFallback && yearId !== '',
	});

	const courses: CourseListItem[] = useMemo(
		() => resolveCourseList(dashboard.data, assigned.data),
		[dashboard.data, assigned.data],
	);

	const isLoading =
		dashboard.isLoading ||
		(needsFallback && (year.isLoading || assigned.isLoading));

	return {
		courses,
		isLoading,
		refetch: async () => {
			await dashboard.refetch();
		},
	};
};
