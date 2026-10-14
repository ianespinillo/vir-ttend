import { ACADEMIC_ROUTES } from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface AssignWorkshopPreceptorVariables {
	courseId: string;
	commissionId: string;
	/** null removes the assignment. */
	preceptorId: string | null;
}

export function useAssignWorkshopPreceptor() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, AssignWorkshopPreceptorVariables>({
		mutationFn: async ({ commissionId, preceptorId }) => {
			await apiClient.put(
				ACADEMIC_ROUTES.workshopCommissionPreceptor(commissionId),
				{ preceptorId },
			);
		},
		onSuccess: (_data, { courseId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.workshopCommissions.byCourse(courseId),
			});
		},
	});
}
