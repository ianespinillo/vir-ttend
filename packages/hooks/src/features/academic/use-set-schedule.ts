import {
	ACADEMIC_ROUTES,
	type IScheduleSlotResponse,
	type SetScheduleFormValues,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useSetSchedule() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: SetScheduleFormValues) => {
			const res = await apiClient.post<IScheduleSlotResponse[]>(
				ACADEMIC_ROUTES.schedule,
				data,
			);
			return res.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ['schedule', variables.courseId],
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.courses.detail(variables.courseId),
			});
		},
	});
}
