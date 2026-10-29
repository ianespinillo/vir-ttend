import { queryOptions } from '@tanstack/react-query';
import {
	fetchActiveAcademicYear,
	fetchCourseHistory,
	fetchCourseStudents,
	fetchDailyAttendance,
	fetchMySubjects,
	fetchMyWorkshopCommissions,
	fetchPreceptorCourses,
	fetchPreceptorDashboard,
	fetchSubjectAttendance,
	fetchSubjectStudents,
	fetchWorkshopAttendance,
	getDailyNotHeld,
	getWorkshopNotHeld,
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
	courseHistory: (courseId: string, from: string, to: string) =>
		queryOptions({
			queryKey: queryKeys.courseHistory(courseId, from, to),
			queryFn: () => fetchCourseHistory(courseId, from, to),
		}),
	mySubjects: () =>
		queryOptions({
			queryKey: queryKeys.mySubjects(),
			queryFn: fetchMySubjects,
		}),
	subjectStudents: (subjectId: string, date?: string) =>
		queryOptions({
			queryKey: queryKeys.subjectStudents(subjectId, date),
			queryFn: () => fetchSubjectStudents(subjectId, date),
		}),
	subjectAttendance: (subjectId: string, date: string) =>
		queryOptions({
			queryKey: queryKeys.subjectAttendance(subjectId, date),
			queryFn: () => fetchSubjectAttendance(subjectId, date),
		}),
	myWorkshopCommissions: (date: string) =>
		queryOptions({
			queryKey: queryKeys.myWorkshopCommissions(date),
			queryFn: () => fetchMyWorkshopCommissions(date),
		}),
	workshopAttendance: (commissionId: string, date: string) =>
		queryOptions({
			queryKey: queryKeys.workshopAttendance(commissionId, date),
			queryFn: () => fetchWorkshopAttendance(commissionId, date),
		}),
	dailyNotHeld: (courseId: string, date: string) =>
		queryOptions({
			queryKey: queryKeys.dailyNotHeld(courseId, date),
			queryFn: () => getDailyNotHeld(courseId, date),
		}),
	workshopNotHeld: (commissionId: string, date: string) =>
		queryOptions({
			queryKey: queryKeys.workshopNotHeld(commissionId, date),
			queryFn: () => getWorkshopNotHeld(commissionId, date),
		}),
};
