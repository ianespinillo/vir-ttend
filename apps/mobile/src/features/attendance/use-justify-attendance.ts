import { useMutation, useQueryClient } from '@tanstack/react-query';
import { justifyAttendance } from './api';
import {
	type JustifyPayload,
	applyJustification,
	getJustifyErrorMessage,
} from './justification';
import { queryKeys } from './query-keys';
import type { DailyAttendance } from './types';

export interface JustifyAttendanceVariables extends JustifyPayload {
	recordId: string;
	courseId: string;
	/** Day of the record (`YYYY-MM-DD`), used to refresh its sheet. */
	date: string;
}

/**
 * Justifies one absent record (online only). On success the day's cached
 * records are patched right away so the badge appears, then the day, the
 * course history and the dashboard are refetched for server truth.
 *
 * `networkMode: 'always'` + no retries: the call is never paused or replayed
 * (the endpoint is not idempotent), a lost connection surfaces as an error.
 */
export const useJustifyAttendance = () => {
	const queryClient = useQueryClient();

	const mutation = useMutation<void, unknown, JustifyAttendanceVariables>({
		networkMode: 'always',
		retry: false,
		mutationFn: ({ recordId, reason, notes }) =>
			justifyAttendance(recordId, { reason, notes }),
		onSuccess: (_data, { recordId, reason, notes, courseId, date }) => {
			queryClient.setQueryData<DailyAttendance>(
				queryKeys.dailyAttendance(courseId, date),
				(previous) =>
					previous
						? {
								...previous,
								records: applyJustification(previous.records, recordId, {
									reason,
									notes,
								}),
							}
						: previous,
			);
			void queryClient.invalidateQueries({
				queryKey: queryKeys.dailyAttendance(courseId, date),
			});
			void queryClient.invalidateQueries({
				queryKey: queryKeys.courseHistoryPrefix(courseId),
			});
			void queryClient.invalidateQueries({
				queryKey: queryKeys.preceptorDashboard(date),
			});
		},
	});

	return {
		...mutation,
		errorMessage: mutation.isError
			? getJustifyErrorMessage(mutation.error)
			: null,
	};
};
