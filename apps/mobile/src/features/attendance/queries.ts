import { queryOptions } from '@tanstack/react-query';
import {
	fetchActiveAcademicYear,
	fetchCourseStudents,
	fetchDailyAttendance,
	fetchMySubjects,
	fetchPreceptorCourses,
	fetchPreceptorDashboard,
	fetchSubjectAttendance,
	fetchSubjectStudents,
} from './api';
import { queryKeys } from './query-keys';

/**
 * Key + fetcher pairs shared by screens (`useQuery`) and by the offline
 * preload (`queryClient.fetchQuery`), so both always hit the same cache entry.
 */
export const attendanceQueries = {
	activeAcademicYear: () =>
		queryOptions({
			queryKey: queryKeys.activeAcademicYear(),
			queryFn: fetchActiveAcademicYear,
		}),
	preceptorDashboard: (date: string) =>
		queryOptions({
			queryKey: queryKeys.preceptorDashboard(date),
			queryFn: () => fetchPreceptorDashboard(date),
		}),
	preceptorCourses: (academicYearId: string) =>
		queryOptions({
			queryKey: queryKeys.preceptorCourses(academicYearId),
			queryFn: () => fetchPreceptorCourses(academicYearId),
		}),
	courseStudents: (courseId: string) =>
		queryOptions({
			queryKey: queryKeys.courseStudents(courseId),
			queryFn: () => fetchCourseStudents(courseId),
		}),
	dailyAttendance: (courseId: string, date: string) =>
		queryOptions({
			queryKey: queryKeys.dailyAttendance(courseId, date),
			queryFn: () => fetchDailyAttendance(courseId, date),
		}),
	mySubjects: () =>
		queryOptions({
			queryKey: queryKeys.mySubjects(),
			queryFn: fetchMySubjects,
		}),
	subjectStudents: (subjectId: string) =>
		queryOptions({
			queryKey: queryKeys.subjectStudents(subjectId),
			queryFn: () => fetchSubjectStudents(subjectId),
		}),
	subjectAttendance: (subjectId: string, date: string) =>
		queryOptions({
			queryKey: queryKeys.subjectAttendance(subjectId, date),
			queryFn: () => fetchSubjectAttendance(subjectId, date),
		}),
};
