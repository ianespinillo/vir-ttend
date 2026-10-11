import type { CourseListItem, PreceptorCourse } from './types';

/** Maps a `GET /courses/by-preceptor` row to the shared course list row. */
export const preceptorCourseToListItem = (
	course: PreceptorCourse,
): CourseListItem => ({
	courseId: course.id,
	courseName: course.fullName,
	level: course.level,
	shift: course.shift,
});

/**
 * Picks the course list to show: the dashboard (year-to-date counters)
 * when it has courses, otherwise the courses assigned to the preceptor.
 */
export const resolveCourseList = (
	dashboardCourses: readonly CourseListItem[] | undefined,
	assignedCourses: readonly PreceptorCourse[] | undefined,
): CourseListItem[] => {
	if (dashboardCourses && dashboardCourses.length > 0) {
		return [...dashboardCourses];
	}
	return (assignedCourses ?? []).map(preceptorCourseToListItem);
};
