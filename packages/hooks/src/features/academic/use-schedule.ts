import {
	ACADEMIC_ROUTES,
	type ApiResponse,
	type IScheduleSlotResponse,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useSchedule(courseId?: string) {
	return useQuery<IScheduleSlotResponse[]>({
		queryKey: queryKeys.schedule.byCourse(courseId ?? ''),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<IScheduleSlotResponse[]>>(
				ACADEMIC_ROUTES.schedule,
				{ params: { courseId } },
			);
			return res.data.data ?? [];
		},
		enabled: Boolean(courseId),
		staleTime: 1000 * 60 * 5,
	});
}
