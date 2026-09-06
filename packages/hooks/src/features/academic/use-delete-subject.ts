import { ACADEMIC_ROUTES, type ApiResponse } from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface DeleteSubjectVariables {
	id: string;
	courseId: string;
}

export function useDeleteSubject() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, DeleteSubjectVariables>({
		mutationFn: async ({ id }) => {
			await apiClient.delete<ApiResponse<void>>(ACADEMIC_ROUTES.subject(id));
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.subjects.list(variables.courseId),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.courses.detail(variables.courseId),
			});
		},
	});
}
