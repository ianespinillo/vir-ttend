import {
	ACADEMIC_ROUTES,
	type ApiResponse,
	type CommissionCount,
	type IWorkshopCommissionResponse,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface CreateWorkshopCommissionsVariables {
	courseId: string;
	/** 1 puts every active student in commission 1; 2 splits them 50/50. */
	count: CommissionCount;
}

/** Creates the commissions of a course with the suggested alphabetical split. */
export function useCreateWorkshopCommissions() {
	const queryClient = useQueryClient();

	return useMutation<
		IWorkshopCommissionResponse[],
		Error,
		CreateWorkshopCommissionsVariables
	>({
		mutationFn: async ({ courseId, count }) => {
			const res = await apiClient.post<ApiResponse<IWorkshopCommissionResponse[]>>(
				ACADEMIC_ROUTES.workshopCommissions(courseId),
				{ count },
			);
			return res.data.data;
		},
		onSuccess: (_data, { courseId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.workshopCommissions.byCourse(courseId),
			});
		},
	});
}
