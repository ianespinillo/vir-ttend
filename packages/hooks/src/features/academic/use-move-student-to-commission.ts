import { ACADEMIC_ROUTES } from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface MoveStudentToCommissionVariables {
	courseId: string;
	/** Destination commission. */
	commissionId: string;
	studentId: string;
}

export function useMoveStudentToCommission() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, MoveStudentToCommissionVariables>({
		mutationFn: async ({ commissionId, studentId }) => {
			await apiClient.put(
				ACADEMIC_ROUTES.workshopCommissionStudent(commissionId, studentId),
			);
		},
		onSuccess: (_data, { courseId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.workshopCommissions.byCourse(courseId),
			});
		},
	});
}
