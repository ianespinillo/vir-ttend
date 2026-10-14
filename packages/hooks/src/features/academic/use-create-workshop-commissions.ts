import {
	ACADEMIC_ROUTES,
	type ApiResponse,
	type IWorkshopCommissionResponse,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

/** Creates both commissions of a course with the suggested alphabetical split. */
export function useCreateWorkshopCommissions() {
	const queryClient = useQueryClient();

	return useMutation<IWorkshopCommissionResponse[], Error, string>({
		mutationFn: async (courseId) => {
			const res = await apiClient.post<ApiResponse<IWorkshopCommissionResponse[]>>(
				ACADEMIC_ROUTES.workshopCommissions(courseId),
			);
			return res.data.data;
		},
		onSuccess: (_data, courseId) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.workshopCommissions.byCourse(courseId),
			});
		},
	});
}
