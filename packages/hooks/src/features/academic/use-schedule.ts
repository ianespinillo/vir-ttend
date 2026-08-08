import { ACADEMIC_ROUTES, type IScheduleSlotResponse } from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';

export function useSchedule(courseId?: string) {
	return useQuery<IScheduleSlotResponse[]>({
		queryKey: ['schedule', courseId ?? 'none'],
		queryFn: async () => {
			const res = await apiClient.get<IScheduleSlotResponse[]>(
				ACADEMIC_ROUTES.schedule,
				{
					params: { courseId },
				},
			);
			return res.data;
		},
		enabled: Boolean(courseId),
	});
}
