import {
	ACADEMIC_ROUTES,
	type ApiResponse,
	type IWorkshopCommissionResponse,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

/** Re-splits the course alphabetically and moves students between commissions. */
export function useRegenerateWorkshopCommissions() {
	const queryClient = useQueryClient();

	return useMutation<IWorkshopCommissionResponse[], Error, string>({
		mutationFn: async (courseId) => {
			const res = await apiClient.post<ApiResponse<IWorkshopCommissionResponse[]>>(
				ACADEMIC_ROUTES.workshopCommissionsRegenerate(courseId),
				{ confirm: true },
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
