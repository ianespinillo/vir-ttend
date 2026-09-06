import {
	ACADEMIC_ROUTES,
	type ApiResponse,
	type IScheduleSlotResponse,
	type SetScheduleFormValues,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useSetSchedule() {
	const queryClient = useQueryClient();

	return useMutation<IScheduleSlotResponse[], Error, SetScheduleFormValues>({
		mutationFn: async (data) => {
			const res = await apiClient.post<ApiResponse<IScheduleSlotResponse[]>>(
				ACADEMIC_ROUTES.schedule,
				data,
			);
			return res.data.data;
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.schedule.byCourse(variables.courseId),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.courses.detail(variables.courseId),
			});
		},
	});
}
