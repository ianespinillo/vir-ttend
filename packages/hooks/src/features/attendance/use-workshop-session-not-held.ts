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

export interface WorkshopSessionNotHeldTarget {
	commissionId: string;
	date: string;
}

export interface MarkWorkshopSessionNotHeldPayload
	extends WorkshopSessionNotHeldTarget {
	reason?: string;
}

/** Whether the workshop of a commission was marked as not held on a date. */
export function useWorkshopSessionNotHeld(commissionId: string, date: string) {
	return useQuery<SessionNotHeldStatus>({
		queryKey: queryKeys.attendance.workshopNotHeld(commissionId, date),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<SessionNotHeldStatus>>(
				ATTENDANCE_ROUTES.workshopNotHeld,
				{ params: { commissionId, date } },
			);
			return res.data.data ?? { notHeld: false };
		},
		enabled: Boolean(commissionId && date),
	});
}

function useInvalidateWorkshopDay() {
	const queryClient = useQueryClient();
	return (commissionId: string, date: string) => {
		queryClient.invalidateQueries({
			queryKey: queryKeys.attendance.workshopNotHeld(commissionId, date),
		});
		queryClient.invalidateQueries({
			queryKey: queryKeys.attendance.workshop(commissionId, date),
		});
	};
}

/** Marks the workshop as not held; deletes the day's saved records. */
export function useMarkWorkshopSessionNotHeld() {
	const invalidateDay = useInvalidateWorkshopDay();

	return useMutation<
		MarkSessionNotHeldResult,
		AxiosError<ErrorResponse>,
		MarkWorkshopSessionNotHeldPayload
	>({
		mutationFn: async ({ commissionId, date, reason }) => {
			const res = await apiClient.post<ApiResponse<MarkSessionNotHeldResult>>(
				ATTENDANCE_ROUTES.workshopNotHeld,
				{ commissionId, date, reason },
			);
			return res.data.data;
		},
		onSuccess: (_, { commissionId, date }) => invalidateDay(commissionId, date),
	});
}

/** Reopens registration for the day; deleted records are not restored. */
export function useUnmarkWorkshopSessionNotHeld() {
	const invalidateDay = useInvalidateWorkshopDay();

	return useMutation<
		void,
		AxiosError<ErrorResponse>,
		WorkshopSessionNotHeldTarget
	>({
		mutationFn: async ({ commissionId, date }) => {
			await apiClient.delete(ATTENDANCE_ROUTES.workshopNotHeld, {
				params: { commissionId, date },
			});
		},
		onSuccess: (_, { commissionId, date }) => invalidateDay(commissionId, date),
	});
}
