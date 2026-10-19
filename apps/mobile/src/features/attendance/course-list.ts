import { isWorkshopOnlyCourse } from '@repo/common/constants';
import type { CourseListItem, PreceptorCourse } from './types';

/** Maps a `GET /courses/by-preceptor` row to the shared course list row. */
export const preceptorCourseToListItem = (
	course: PreceptorCourse,
): CourseListItem => ({
	courseId: course.id,
	courseName: course.fullName,
	level: course.level,
	shift: course.shift,
	workshopOnly: isWorkshopOnlyCourse(course),
});

/** Workshop-only courses (7th year technical) take no daily attendance. */
const takesDailyAttendance = (course: CourseListItem): boolean =>
	!course.workshopOnly;

/**
 * Picks the daily-attendance course list to show: the dashboard (year-to-date
 * counters) when it has courses, otherwise the courses assigned to the
 * preceptor. Workshop-only courses are left out: they have no daily attendance.
 */
export const resolveCourseList = (
	dashboardCourses: readonly CourseListItem[] | undefined,
	assignedCourses: readonly PreceptorCourse[] | undefined,
): CourseListItem[] => {
	if (dashboardCourses && dashboardCourses.length > 0) {
		return dashboardCourses.filter(takesDailyAttendance);
	}
	return (assignedCourses ?? [])
		.map(preceptorCourseToListItem)
		.filter(takesDailyAttendance);
};

/**
 * Whether `courseId` is a workshop-only course, from course rows already
 * cached (dashboard snapshots and/or courses assigned to the preceptor).
 * Unknown courses are not workshop-only.
 */
export const isCachedWorkshopOnlyCourse = (
	courseId: string,
	dashboards: readonly (readonly CourseListItem[] | undefined)[],
	assignedLists: readonly (readonly PreceptorCourse[] | undefined)[],
): boolean =>
	dashboards.some((list) =>
		list?.some((course) => course.courseId === courseId && course.workshopOnly),
	) ||
	assignedLists.some((list) =>
		list?.some(
			(course) => course.id === courseId && isWorkshopOnlyCourse(course),
		),
	);
