import {
	ATTENDANCE_ROUTES,
	type ApiResponse,
	type ErrorResponse,
	type MarkSessionNotHeldResult,
	type SessionNotHeldStatus,
} from '@repo/common';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface DailySessionNotHeldTarget {
	courseId: string;
	date: string;
}

export interface MarkDailySessionNotHeldPayload
	extends DailySessionNotHeldTarget {
	reason?: string;
}

/** Whether the theory class of a course was marked as not held on a date. */
export function useDailySessionNotHeld(courseId: string, date: string) {
	return useQuery<SessionNotHeldStatus>({
		queryKey: queryKeys.attendance.dailyNotHeld(courseId, date),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<SessionNotHeldStatus>>(
				ATTENDANCE_ROUTES.dailyNotHeld,
				{ params: { courseId, date } },
			);
			return res.data.data ?? { notHeld: false };
		},
		enabled: Boolean(courseId && date),
	});
}

function useInvalidateDailyDay() {
	const queryClient = useQueryClient();
	return (courseId: string, date: string) => {
		queryClient.invalidateQueries({
			queryKey: queryKeys.attendance.dailyNotHeld(courseId, date),
		});
		queryClient.invalidateQueries({
			queryKey: queryKeys.attendance.daily(courseId, date),
		});
		queryClient.invalidateQueries({
			queryKey: queryKeys.attendance.metrics(courseId, date),
		});
		queryClient.invalidateQueries({ queryKey: ['attendance', 'history'] });
	};
}

/** Marks the theory class as not held; deletes the day's saved records. */
export function useMarkDailySessionNotHeld() {
	const invalidateDay = useInvalidateDailyDay();

	return useMutation<
		MarkSessionNotHeldResult,
		AxiosError<ErrorResponse>,
		MarkDailySessionNotHeldPayload
	>({
		mutationFn: async ({ courseId, date, reason }) => {
			const res = await apiClient.post<ApiResponse<MarkSessionNotHeldResult>>(
				ATTENDANCE_ROUTES.dailyNotHeld,
				{ courseId, date, reason },
			);
			return res.data.data;
		},
		onSuccess: (_, { courseId, date }) => invalidateDay(courseId, date),
	});
}

/** Reopens registration for the day; deleted records are not restored. */
export function useUnmarkDailySessionNotHeld() {
	const invalidateDay = useInvalidateDailyDay();

	return useMutation<void, AxiosError<ErrorResponse>, DailySessionNotHeldTarget>(
		{
			mutationFn: async ({ courseId, date }) => {
				await apiClient.delete(ATTENDANCE_ROUTES.dailyNotHeld, {
					params: { courseId, date },
				});
			},
			onSuccess: (_, { courseId, date }) => invalidateDay(courseId, date),
		},
	);
}
