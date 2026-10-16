import { useQueries } from '@tanstack/react-query';
import { attendanceQueries } from './queries';
import type { AttendanceRecordItem } from './types';

/**
 * Today's records for several courses, read through the shared
 * `dailyAttendance` keys: cache-first, so they resolve offline from the
 * persisted cache (the offline preload fills them). `undefined` = not known.
 */
export const useCoursesTodayRecords = (
	courseIds: readonly string[],
	date: string,
	enabled: boolean,
): Map<string, AttendanceRecordItem[] | undefined> => {
	const results = useQueries({
		queries: courseIds.map((courseId) => ({
			...attendanceQueries.dailyAttendance(courseId, date),
			enabled,
		})),
	});
	return new Map(
		courseIds.map((courseId, index) => [courseId, results[index]?.data?.records]),
	);
};

/** Same as `useCoursesTodayRecords` for a preceptor's workshop commissions. */
export const useCommissionsTodayRecords = (
	commissionIds: readonly string[],
	date: string,
	enabled: boolean,
): Map<string, AttendanceRecordItem[] | undefined> => {
	const results = useQueries({
		queries: commissionIds.map((commissionId) => ({
			...attendanceQueries.workshopAttendance(commissionId, date),
			enabled,
		})),
	});
	return new Map(
		commissionIds.map((commissionId, index) => [
			commissionId,
			results[index]?.data?.records,
		]),
	);
};

/** Same as `useCoursesTodayRecords` for a teacher's subjects of the day. */
export const useSubjectsTodayRecords = (
	subjectIds: readonly string[],
	date: string,
	enabled: boolean,
): Map<string, AttendanceRecordItem[] | undefined> => {
	const results = useQueries({
		queries: subjectIds.map((subjectId) => ({
			...attendanceQueries.subjectAttendance(subjectId, date),
			enabled,
		})),
	});
	return new Map(
		subjectIds.map((subjectId, index) => [
			subjectId,
			results[index]?.data?.records,
		]),
	);
};
