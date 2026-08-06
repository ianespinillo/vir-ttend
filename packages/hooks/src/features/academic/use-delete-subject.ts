import { ACADEMIC_ROUTES } from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';

export interface DeleteSubjectParams {
	id: string;
	courseId?: string;
}

export function useDeleteSubject() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id }: DeleteSubjectParams) => {
			const res = await apiClient.delete(ACADEMIC_ROUTES.subject(id));
			return res.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ['subjects'] });
			if (variables.courseId) {
				queryClient.invalidateQueries({
					queryKey: ['courses', 'detail', variables.courseId],
				});
			}
		},
	});
}
