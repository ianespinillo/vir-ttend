import {
	ACADEMIC_ROUTES,
	type CreateSubjectFormValues,
	type ISubjectResponse,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';

export function useCreateSubject() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: CreateSubjectFormValues) => {
			const res = await apiClient.post<ISubjectResponse>(
				ACADEMIC_ROUTES.subjects,
				data,
			);
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
