import type {
	MarkSessionNotHeldResult,
	SessionNotHeldStatus,
} from '@repo/common/types';
import {
	type QueryKey,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query';
import {
	markDailyNotHeld,
	markWorkshopNotHeld,
	unmarkDailyNotHeld,
	unmarkWorkshopNotHeld,
} from './api';
import { getNotHeldErrorMessage } from './not-held';
import { queryKeys } from './query-keys';

export interface MarkNotHeldVariables {
	/** Course id (daily) or commission id (workshop). */
	targetId: string;
	/** Day (`YYYY-MM-DD`). */
	date: string;
	reason?: string;
}

export interface UnmarkNotHeldVariables {
	targetId: string;
	date: string;
}

/**
 * Mark/unmark are online-only direct mutations (never the outbox): marking
 * deletes the day's records on the server, so it is not safe to queue or
 * replay. `networkMode: 'always'` + no retries surface a lost connection as an
 * error instead of pausing the call.
 */
const useNotHeldMutations = ({
	statusKey,
	invalidate,
	mark,
	unmark,
}: {
	statusKey: (targetId: string, date: string) => QueryKey;
	/** Keys refreshed after any change (the day's attendance and derived data). */
	invalidate: (targetId: string, date: string) => QueryKey[];
	mark: (
		targetId: string,
		date: string,
		reason?: string,
	) => Promise<MarkSessionNotHeldResult>;
	unmark: (targetId: string, date: string) => Promise<void>;
}) => {
	const queryClient = useQueryClient();

	const refresh = (targetId: string, date: string) => {
		void queryClient.invalidateQueries({ queryKey: statusKey(targetId, date) });
		for (const queryKey of invalidate(targetId, date)) {
			void queryClient.invalidateQueries({ queryKey });
		}
	};

	const markMutation = useMutation<
		MarkSessionNotHeldResult,
		unknown,
		MarkNotHeldVariables
	>({
		networkMode: 'always',
		retry: false,
		mutationFn: ({ targetId, date, reason }) => mark(targetId, date, reason),
		onSuccess: (_data, { targetId, date, reason }) => {
			// Flip the status right away; the refetch confirms it.
			queryClient.setQueryData<SessionNotHeldStatus>(statusKey(targetId, date), {
				notHeld: true,
				reason,
			});
			refresh(targetId, date);
		},
	});

	const unmarkMutation = useMutation<void, unknown, UnmarkNotHeldVariables>({
		networkMode: 'always',
		retry: false,
		mutationFn: ({ targetId, date }) => unmark(targetId, date),
		onSuccess: (_data, { targetId, date }) => {
			queryClient.setQueryData<SessionNotHeldStatus>(statusKey(targetId, date), {
				notHeld: false,
			});
			refresh(targetId, date);
		},
	});

	return {
		mark: {
			...markMutation,
			errorMessage: markMutation.isError
				? getNotHeldErrorMessage(markMutation.error)
				: null,
		},
		unmark: {
			...unmarkMutation,
			errorMessage: unmarkMutation.isError
				? getNotHeldErrorMessage(unmarkMutation.error)
				: null,
		},
	};
};

/** Theory class of a course (preceptor daily screen). */
export const useDailyNotHeld = () =>
	useNotHeldMutations({
		statusKey: queryKeys.dailyNotHeld,
		invalidate: (courseId, date) => [
			queryKeys.dailyAttendance(courseId, date),
			queryKeys.courseHistoryPrefix(courseId),
			queryKeys.preceptorDashboard(date),
		],
		mark: markDailyNotHeld,
		unmark: unmarkDailyNotHeld,
	});

/** Workshop of a commission. */
export const useWorkshopNotHeld = () =>
	useNotHeldMutations({
		statusKey: queryKeys.workshopNotHeld,
		invalidate: (commissionId, date) => [
			queryKeys.workshopAttendance(commissionId, date),
		],
		mark: markWorkshopNotHeld,
		unmark: unmarkWorkshopNotHeld,
	});
